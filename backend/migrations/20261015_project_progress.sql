-- Additive project progress storage. Backend access follows verified staff permissions.
-- No browser access policies: use the authenticated backend endpoints.
BEGIN;

CREATE TABLE IF NOT EXISTS project_progress (
	project_id INTEGER NOT NULL, 
	phase VARCHAR(30) NOT NULL, 
	current_update TEXT, 
	waiting_for TEXT, 
	hold_reason TEXT, 
	expected_input VARCHAR(250), 
	next_action TEXT, 
	delivery_choice VARCHAR(250), 
	follow_up_date DATE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (project_id), 
	FOREIGN KEY(project_id) REFERENCES projects (id) ON DELETE CASCADE
);

ALTER TABLE public.project_progress ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS project_progress_events (
	id SERIAL NOT NULL, 
	project_id INTEGER NOT NULL, 
	staff_id INTEGER, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	snapshot JSON NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id) ON DELETE CASCADE, 
	FOREIGN KEY(staff_id) REFERENCES staff (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_project_progress_events_project_id ON project_progress_events (project_id);

ALTER TABLE public.project_progress_events ENABLE ROW LEVEL SECURITY;

COMMIT;
