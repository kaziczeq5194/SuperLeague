use std::sync::Mutex;
use rusqlite::Connection;

pub mod db;
pub mod lcu;
pub mod commands;

pub struct AppState {
    pub db: Mutex<Connection>,
    pub lcu_connected: Mutex<bool>,
}
