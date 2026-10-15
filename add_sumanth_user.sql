INSERT INTO users (username, email, password_hash, first_name, last_name, phone_number, is_active, is_account_locked, failed_login_attempts)
VALUES ('sumanth.puli', 'sumanth@gmail.com', '$2a$12$uEdpZ233XM9IG4bpcGvnSuzmCkfwkR3iEyX8eAL2og5IOeT6ahS0G', 'sumanth', 'puli', '+91 98765 43210', 1, 0, 0);

SET @new_user_id = LAST_INSERT_ID();

INSERT INTO user_roles (user_id, role_id) VALUES (@new_user_id, 9);

UPDATE patients SET user_id = @new_user_id WHERE id = 1;
