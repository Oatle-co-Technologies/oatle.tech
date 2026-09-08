INSERT INTO staff (
	name,
	email,
	access_level,
	employment_type,
	is_temporary,
	active
)
VALUES (
	'Oatle Technologies Admin',
	'info@oatle-technologies.co.za',
	'admin',
	'employee',
	FALSE,
	TRUE
)
ON CONFLICT (email) DO UPDATE
SET access_level = 'admin',
		active = TRUE;