//! Arbitrary IPC commands.

use std::{fs::File, sync::Mutex};

use tauri::{command, AppHandle, Manager, Wry};

use crate::{
    ctx::Ctx,
    ipc::IpcResponse,
    model::{Project, ProjectBmc, SettingsBmc, Theme, ThemeBmc},
    prelude::Error,
    state::{ActiveQueue, State},
};

#[command]
pub fn get_active_queue(state: tauri::State<'_, Mutex<State>>) -> IpcResponse<Option<ActiveQueue>> {
    let queue = state.lock().unwrap().get_active_queue();

    Ok(queue.clone()).into()
}

#[command]
pub fn set_active_queue(
    data: ActiveQueue,
    app: AppHandle<Wry>,
    state: tauri::State<'_, Mutex<State>>,
) -> IpcResponse<Option<ActiveQueue>> {
    let queue = state.lock().unwrap().set_active_queue(data);

    app.emit_all("set_active_queue", queue.clone()).unwrap();

    Ok(queue.clone()).into()
}

#[command]
pub fn deactivate_queue(
    app: AppHandle<Wry>,
    state: tauri::State<'_, Mutex<State>>,
) -> IpcResponse<()> {
    state.lock().unwrap().deactivate_queue();

    app.emit_all("deactivate_queue", ()).unwrap();

    Ok(()).into()
}

#[command]
pub async fn open_audio_directory(os_type: String, handle: AppHandle) {
    let cmd = match os_type.as_str() {
        "Linux" => "xdg-open",
        "Darwin" => "open",
        "Windows_NT" => "explorer",
        _ => "xdp-open",
    };

    let path = handle
        .path_resolver()
        .resolve_resource("./assets/audio")
        .expect("get audio directory");

    std::process::Command::new(cmd).arg(path).spawn().unwrap();
}

#[command]
pub async fn get_current_theme(app: AppHandle<Wry>) -> IpcResponse<Theme> {
    match Ctx::from_app(app) {
        Ok(ctx) => {
            let settings = SettingsBmc::get().unwrap();
            ThemeBmc::get(ctx, &settings.current_theme_id).await.into()
        }
        Err(_) => Err(Error::CtxFail).into(),
    }
}

#[command]
pub async fn get_current_project(app: AppHandle<Wry>) -> IpcResponse<Project> {
    match Ctx::from_app(app) {
        Ok(ctx) => {
            let settings = SettingsBmc::get().unwrap();

            if let Some(current_project_id) = settings.current_project_id {
                ProjectBmc::get(ctx, &current_project_id).await.into()
            } else {
                Err(Error::NoCurrentProject).into()
            }
        }
        Err(_) => Err(Error::CtxFail).into(),
    }
}

#[command]
pub async fn play_audio(audio: Option<String>, handle: AppHandle) {
    // TODO: Open socket connection to listen for audio volume changes
    let mut settings = SettingsBmc::get().unwrap();

    let audio = match audio {
        Some(path) => path,
        None => settings.alert_audio,
    };

    let path = handle
        .path_resolver()
        .resolve_resource(format!("./assets/audio/{}", &audio))
        .expect("failed to resolve resource");

    let (_stream, stream_handle) = rodio::OutputStream::try_default().unwrap();

    for _i in 0..settings.alert_repeat {
        settings = SettingsBmc::get().unwrap();

        let file = File::open(path.as_path()).unwrap();
        let sink = stream_handle.play_once(file).unwrap();
        sink.set_volume(settings.alert_volume as f32);
        sink.sleep_until_end();
    }
}
