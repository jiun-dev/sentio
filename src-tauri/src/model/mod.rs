// Backend model controllers for the application.

use serde::Serialize;
use ts_rs::TS;

mod project;
mod queue;
mod session;
mod settings;
mod theme;

// Re-Exports
pub use project::*;
pub use queue::*;
pub use session::*;
pub use settings::*;
pub use theme::*;

pub type Minutes = i64;

/// Delete mutation queries will return an {id} struct.
#[derive(TS, Serialize, Clone)]
#[ts(export, export_to = "../src/bindings/")]
pub struct ModelDeleteResultData {
    pub id: String,
}

impl From<String> for ModelDeleteResultData {
    fn from(id: String) -> Self {
        Self { id }
    }
}
