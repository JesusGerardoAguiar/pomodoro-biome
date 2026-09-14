use crate::game_state::BiomeState;

/// Completed-pomodoro counts required to enter each stage. 3 completed
/// pomodoros (75 minutes of focused work) advances one stage — progression
/// depends only on completed sessions, with no way to accelerate it.
pub const STAGE_THRESHOLDS: [u32; 7] = [0, 3, 6, 9, 12, 15, 18];

pub fn stage_for_sessions(total_sessions: u32) -> u32 {
    let mut stage = 0;
    for (i, &threshold) in STAGE_THRESHOLDS.iter().enumerate() {
        if total_sessions >= threshold {
            stage = i as u32;
        }
    }
    stage
}

pub fn complete_session(state: &mut BiomeState, duration_minutes: u32) {
    state.total_sessions += 1;
    state.current_stage = stage_for_sessions(state.total_sessions);
    state.last_updated = chrono::Utc::now();
    state.session_history.push(crate::game_state::Session {
        date: state.last_updated,
        duration_minutes,
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn stage_for_sessions_at_stage_boundaries() {
        assert_eq!(stage_for_sessions(0), 0);
        assert_eq!(stage_for_sessions(2), 0);
        assert_eq!(stage_for_sessions(3), 1);
        assert_eq!(stage_for_sessions(17), 5);
        assert_eq!(stage_for_sessions(18), 6);
        assert_eq!(stage_for_sessions(100), 6);
    }

    #[test]
    fn complete_session_increments_total_and_records_history() {
        let mut state = BiomeState::new();
        complete_session(&mut state, 25);

        assert_eq!(state.total_sessions, 1);
        assert_eq!(state.current_stage, 0);
        assert_eq!(state.session_history.len(), 1);
        assert_eq!(state.session_history[0].duration_minutes, 25);
    }

    #[test]
    fn complete_session_advances_stage_at_threshold() {
        let mut state = BiomeState::new();
        state.total_sessions = 2;
        complete_session(&mut state, 25);

        assert_eq!(state.total_sessions, 3);
        assert_eq!(state.current_stage, 1);
    }

    #[test]
    fn complete_session_does_not_advance_stage_before_threshold() {
        let mut state = BiomeState::new();
        complete_session(&mut state, 25);
        complete_session(&mut state, 25);

        assert_eq!(state.total_sessions, 2);
        assert_eq!(state.current_stage, 0);
    }
}
