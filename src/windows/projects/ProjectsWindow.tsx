import React from "react";
import { appWindow } from "@tauri-apps/api/window";
import { MdAddCircle, MdClose, MdDelete } from "react-icons/md";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import autoAnimate from "@formkit/auto-animate";

import { Project } from "../../bindings/Project";
import { ipc_invoke } from "../../ipc";
import useGlobal from "../../store";
import { ModelDeleteResultData } from "../../bindings/ModelDeleteResultData";
import { Settings } from "../../bindings/Settings";

const ProjectsWindow: React.FC = () => {
  const projects = useGlobal((state) => state.projects);
  const setProjects = useGlobal((state) => state.setProjects);
  const currentProject = useGlobal((state) => state.currentProject);
  const removeProject = useGlobal((state) => state.removeProject);

  const [viewCreate, setViewCreate] = React.useState(false);

  const nameRef = React.useRef<HTMLInputElement | null>(null);
  const [containerRef] = useAutoAnimate<HTMLDivElement>();

  const createProject = (name: string) => {
    if (projects.find((p) => p.name.toLowerCase() === name.toLowerCase())) {
      nameRef.current?.focus();

      // TODO: display error to user that this name is used

      return;
    }
    ipc_invoke<Project>("create_project", {
      data: { name },
    })
      .then(() => {
        setViewCreate(false);
      })
      .catch((err) => console.log(err));
  };

  React.useEffect(() => {
    ipc_invoke<Project[]>("get_projects")
      .then((res) => setProjects(res.data))
      .catch((err) => console.log(err));
  }, []);

  const deleteProject = async (id: string) => {
    const res = await ipc_invoke<ModelDeleteResultData>("delete_project", {
      id,
    });
    removeProject(res.data.id);
  };

  const updateCurrentProject = async (id: string | null) => {
    await ipc_invoke<Settings>("update_settings", {
      data: { current_project_id: id },
    });
  };

  return (
    <div className="w-screen min-h-screen flex flex-col p-4 gap-2">
      <div
        data-tauri-drag-region
        className="flex flex-row items-center justify-between p-1"
      >
        <span className="text-lg">Projects</span>
        <button className="btn btn-ghost" onClick={() => appWindow.close()}>
          <MdClose size={32} />
        </button>
      </div>
      <div className="flex flex-col gap-4 p-1">
        {viewCreate ? (
          <div className="flex flex-row items-center gap-2">
            <input
              className="input"
              placeholder="Name"
              autoFocus
              type="text"
              onKeyUp={(e) =>
                e.key === "Enter" && createProject(e.currentTarget.value)
              }
              minLength={1}
              maxLength={16}
            />
            <button
              className="btn btn-ghost"
              onClick={() => setViewCreate(false)}
            >
              <MdClose size={24} />
            </button>
          </div>
        ) : (
          <button
            className="btn btn-ghost justify-start gap-2"
            onClick={() => setViewCreate(true)}
          >
            <MdAddCircle size={24} />
            <span>Add a project</span>
          </button>
        )}
        <div ref={containerRef} className="flex flex-col gap-2">
          {projects.map((project) => (
            <ProjectView
              key={project.id}
              data={project}
              deleteProject={deleteProject}
              selectProject={updateCurrentProject}
              selected={currentProject?.id === project.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface ProjectViewProps {
  data: Project;
  deleteProject: (id: string) => void;
  selectProject: (id: string | null) => void;
  selected: boolean;
}

const ProjectView: React.FC<ProjectViewProps> = ({
  data,
  deleteProject,
  selectProject,
  selected,
}) => {
  const [viewDelete, setViewDelete] = React.useState(false);

  const delRef = React.useRef<HTMLDivElement | null>(null);
  const parent = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    parent.current && autoAnimate(parent.current);
  }, [parent]);

  React.useEffect(() => {
    if (viewDelete) {
      delRef.current?.scrollIntoView({ block: "center" });
    }
  }, [viewDelete]);

  return (
    <div
      ref={parent}
      className="group flex flex-col gap-2 bg-base rounded overflow-clip"
    >
      <div
        className={`group cursor-pointer flex flex-row items-center justify-between ${
          selected && "bg-primary text-window"
        }`}
      >
        <p
          className="w-full p-2"
          onClick={async () => selectProject(!selected ? data.id : null)}
        >
          {data.name}
        </p>
        <button
          className={`btn btn-ghost px-2 text-text transition-opacity opacity-0 group-hover:opacity-100 ${
            selected && "text-window"
          }`}
          onClick={() => setViewDelete(!viewDelete)}
        >
          <MdDelete size={24} />
        </button>
      </div>
      {viewDelete && (
        <div
          ref={delRef}
          className="flex flex-col gap-2 text-sm text-center p-1 py-2"
        >
          <p>Are you sure you want to delete this project?</p>
          <p>Focused hours will get orphaned.</p>
          <div className="flex flex-row items-center justify-between p-2">
            <button
              className="btn btn-ghost"
              onClick={() => setViewDelete(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={async () => deleteProject(data.id)}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsWindow;
