UPDATE staff
SET access_level = 'admin'
WHERE LOWER(TRIM(email)) = 'info@oatle-technologies.co.za';