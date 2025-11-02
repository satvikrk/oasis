USE music_streaming;

-- 1) Ensure artist exists (create if missing), then capture id
INSERT INTO Artists (name, bio, country, debut_year)
SELECT 'Dire Straits', NULL, 'UK', 1978
WHERE NOT EXISTS (SELECT 1 FROM Artists WHERE name = 'Dire Straits');

SET @artist_id := (SELECT artist_id FROM Artists WHERE name = 'Dire Straits' LIMIT 1);

-- 2) Ensure album exists (create if missing), then capture id
INSERT INTO Albums (title, release_date, genre, cover_url)
SELECT 'Alchemy: Dire Straits Live', '1984-3-16', 'Rock', 'https://upload.wikimedia.org/wikipedia/en/6/6d/Dire_Straits_-_Alchemy_Dire_Straits_Live.jpg'
WHERE NOT EXISTS (SELECT 1 FROM Albums WHERE title = 'Alchemy: Dire Straits Live');

SET @album_id := (SELECT album_id FROM Albums WHERE title = 'Alchemy: Dire Straits Live' LIMIT 1);

-- 3) Ensure song exists (create if missing), then capture id
-- Note: duration is a TIME value; using '00:04:11' for 4 minutes 11 seconds.
-- Adjust file_url to the actual path where you serve the audio (e.g. /media/shock_of_the_lightning.mp3)
INSERT INTO Songs (album_id, title, duration, language, file_url)
SELECT @album_id, 'Alchemy: Dire Straits Live', '00:10:46', 'English', '/media/sultans_of_swing_live.mp3'
WHERE NOT EXISTS (
  SELECT 1 FROM Songs
  WHERE title = 'Sultans of Swing' AND album_id = @album_id
);

SET @song_id := (
  SELECT song_id FROM Songs
  WHERE title = 'Sultans of Swing' AND album_id = @album_id
  LIMIT 1
);

-- 4) Link song <-> artist
INSERT IGNORE INTO Song_Artists (song_id, artist_id, role)
VALUES (@song_id, @artist_id, 'main');

-- 5) Link album <-> artist
INSERT IGNORE INTO Album_Artists (album_id, artist_id)
VALUES (@album_id, @artist_id);


USE music_streaming;

-- 1) Ensure artist exists (create if missing), then capture id
INSERT INTO Artists (name, bio, country, debut_year)
SELECT 'Oasis', NULL, 'UK', 1991
WHERE NOT EXISTS (SELECT 1 FROM Artists WHERE name = 'Oasis');

SET @artist_id := (SELECT artist_id FROM Artists WHERE name = 'Oasis' LIMIT 1);

-- 2) Ensure album exists (create if missing), then capture id
INSERT INTO Albums (title, release_date, genre, cover_url)
SELECT 'Shock of The Lightning - Single', '2008-09-29', 'Rock', 'https://upload.wikimedia.org/wikipedia/en/d/d4/Doys.JPG'
WHERE NOT EXISTS (SELECT 1 FROM Albums WHERE title = 'Shock of The Lightning - Single');

SET @album_id := (SELECT album_id FROM Albums WHERE title = 'Shock of The Lightning - Single' LIMIT 1);

-- 3) Ensure song exists (create if missing), then capture id
-- Note: duration is a TIME value; using '00:04:11' for 4 minutes 11 seconds.
-- Adjust file_url to the actual path where you serve the audio (e.g. /media/shock_of_the_lightning.mp3)
INSERT INTO Songs (album_id, title, duration, language, file_url)
SELECT @album_id, 'Shock of The Lightning', '00:04:11', 'English', '/media/shock_of_the_lightning.mp3'
WHERE NOT EXISTS (
  SELECT 1 FROM Songs
  WHERE title = 'Shock of The Lightning' AND album_id = @album_id
);

SET @song_id := (
  SELECT song_id FROM Songs
  WHERE title = 'Shock of The Lightning' AND album_id = @album_id
  LIMIT 1
);

-- 4) Link song <-> artist
INSERT IGNORE INTO Song_Artists (song_id, artist_id, role)
VALUES (@song_id, @artist_id, 'main');

-- 5) Link album <-> artist
INSERT IGNORE INTO Album_Artists (album_id, artist_id)
VALUES (@album_id, @artist_id);