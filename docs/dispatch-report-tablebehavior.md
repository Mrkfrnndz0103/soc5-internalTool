Table header (final order) & per-column behavior (Submit Report)
    1. Batch # — server assigned ordinal (1st, 2nd, 3rd... Unique count of Hub name reported today)
    2. Cluster Name — autocomplete after 3 chars, values from outbound_map.
    3. Station (Hub name) — auto-filled; auto-split on multi-hub cluster. (if cluster_name maps to 2 hub names, auto-split to 2 rows and fill station_name with each hub name.)
    4. Region — select list (InterSOC, RC, MM/GMA, GMA SOL, GMA NOL, SOL, SOL IIS, VisMin).
    5. Count of TO — integer >= 0.
    6. Total OID Loaded — integer >= 0.
    7. Actual Docked Time — datetime picker.
    8. Dock # — auto-filled from outbound_map; editable; requires per-row dock_confirmed before submit.
    9. Actual Depart Time — datetime picker; validated >= docked time.
    10. Name of Processor — autocomplete after 3 chars.
    11. LH Trip # — must start with LT, uppercase;
    12. Plate # — uppercase; hideable.
    13. Fleet Size — select: 4WH, 6W, 6WF, 10WH, CV
    14. Assigned Ops PIC — OPS ID input; auto-populates name.
    15. System metadata — created_by, created_at, updated_at, verified_flag, verified_by, verified_at, status, seatalk_message_id, csv_file_link, notes.

Field affordances: steppers for ints, inline validation, tooltips, keyboard navigation, date-time pickers respecting locale/timezone.

12. Multi-hub auto-split behavior
  - If cluster value maps to multiple hub rows (in outbound map), UI auto-splits to N rows and fills Station per row.
  - Notify user with toast: "Cluster maps to N hubs — added N row(s)."

    
13. Validation rules (client + server)
Client:
  - Required: cluster_name, station_name, region, count_of_to, total_oid_loaded, dock_number (confirmed), actual_docked_time, assigned_ops_id.
  - Numeric ints >= 0 for counts.
  - actual_depart_time >= actual_docked_time.
  - LH Trip/Plate uppercase enforced client-side.
  - Max rows per submission: 50.
Server (definitive):
  - rows.length <= 10.
  - Required fields check.
  - Numeric validations.
  - Date ordering check.
  - LH Trip regex: ^LT[A-Z0-9]+$ (server uppercases).
  - Plate regex: ^[A-Z0-9\s-]+$ (server uppercases).
  - dock_confirmed must be true.
  - Partial success allowed; return per-row result.

14. Draft persistence (localStorage)
  - Autosave every ~10s and on key actions.
  - Key pattern: drafts:{ops_id}:submit_report:{session_id}.
  - Draft store includes rows, hide/unhide flags, last_saved_at, ui_state.
  - Retention default: 7 days.
  - Export draft to JSON if needed.

Last Updated: 2026-01-07
