-- Add ratings to service_requests
ALTER TABLE service_requests
  ADD COLUMN rating SMALLINT NULL CHECK (rating >= 1 AND rating <= 5),
  ADD COLUMN rating_comment TEXT NULL;
