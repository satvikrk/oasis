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


USE music_streaming;

-- 1) Radiohead - The Bends
INSERT INTO Artists (name, bio, country, debut_year)
SELECT 'Radiohead', NULL, 'UK', 1985
WHERE NOT EXISTS (SELECT 1 FROM Artists WHERE name = 'Radiohead');
SET @artist_id := (SELECT artist_id FROM Artists WHERE name = 'Radiohead' LIMIT 1);
INSERT INTO Albums (title, release_date, genre, cover_url)
SELECT 'The Bends', '1995-03-13', 'Alternative Rock', 'https://upload.wikimedia.org/wikipedia/en/0/0b/Radioheadthebends.png'
WHERE NOT EXISTS (SELECT 1 FROM Albums WHERE title = 'The Bends');
SET @album_id := (SELECT album_id FROM Albums WHERE title = 'The Bends' LIMIT 1);
INSERT INTO Songs (album_id, title, duration, language, file_url)
SELECT @album_id, 'The Bends', '00:04:06', 'English', '/media/the_bends.mp3'
WHERE NOT EXISTS (SELECT 1 FROM Songs WHERE title = 'The Bends' AND album_id = @album_id);
SET @song_id := (SELECT song_id FROM Songs WHERE title = 'The Bends' AND album_id = @album_id LIMIT 1);
INSERT IGNORE INTO Song_Artists (song_id, artist_id, role) VALUES (@song_id, @artist_id, 'main');
INSERT IGNORE INTO Album_Artists (album_id, artist_id) VALUES (@album_id, @artist_id);

-- 2) Radiohead - Decks Dark
INSERT INTO Artists (name, bio, country, debut_year)
SELECT 'Radiohead', NULL, 'UK', 1985
WHERE NOT EXISTS (SELECT 1 FROM Artists WHERE name = 'Radiohead');
SET @artist_id := (SELECT artist_id FROM Artists WHERE name = 'Radiohead' LIMIT 1);
INSERT INTO Albums (title, release_date, genre, cover_url)
SELECT 'A Moon Shaped Pool', '2016-05-08', 'Art Rock', 'https://upload.wikimedia.org/wikipedia/en/6/6a/A_Moon_Shaped_Pool.jpg'
WHERE NOT EXISTS (SELECT 1 FROM Albums WHERE title = 'A Moon Shaped Pool');
SET @album_id := (SELECT album_id FROM Albums WHERE title = 'A Moon Shaped Pool' LIMIT 1);
INSERT INTO Songs (album_id, title, duration, language, file_url)
SELECT @album_id, 'Decks Dark', '00:04:41', 'English', '/media/decks_dark.mp3'
WHERE NOT EXISTS (SELECT 1 FROM Songs WHERE title = 'Decks Dark' AND album_id = @album_id);
SET @song_id := (SELECT song_id FROM Songs WHERE title = 'Decks Dark' AND album_id = @album_id LIMIT 1);
INSERT IGNORE INTO Song_Artists (song_id, artist_id, role) VALUES (@song_id, @artist_id, 'main');
INSERT IGNORE INTO Album_Artists (album_id, artist_id) VALUES (@album_id, @artist_id);

-- 3) Led Zeppelin - Kashmir
INSERT INTO Artists (name, bio, country, debut_year)
SELECT 'Led Zeppelin', NULL, 'UK', 1968
WHERE NOT EXISTS (SELECT 1 FROM Artists WHERE name = 'Led Zeppelin');
SET @artist_id := (SELECT artist_id FROM Artists WHERE name = 'Led Zeppelin' LIMIT 1);
INSERT INTO Albums (title, release_date, genre, cover_url)
SELECT 'Physical Graffiti', '1975-02-24', 'Rock', 'https://upload.wikimedia.org/wikipedia/en/e/e3/Led_Zeppelin_-_Physical_Graffiti.jpg'
WHERE NOT EXISTS (SELECT 1 FROM Albums WHERE title = 'Physical Graffiti');
SET @album_id := (SELECT album_id FROM Albums WHERE title = 'Physical Graffiti' LIMIT 1);
INSERT INTO Songs (album_id, title, duration, language, file_url)
SELECT @album_id, 'Kashmir', '00:08:37', 'English', '/media/kashmir.mp3'
WHERE NOT EXISTS (SELECT 1 FROM Songs WHERE title = 'Kashmir' AND album_id = @album_id);
SET @song_id := (SELECT song_id FROM Songs WHERE title = 'Kashmir' AND album_id = @album_id LIMIT 1);
INSERT IGNORE INTO Song_Artists (song_id, artist_id, role) VALUES (@song_id, @artist_id, 'main');
INSERT IGNORE INTO Album_Artists (album_id, artist_id) VALUES (@album_id, @artist_id);

-- 4) Dire Straits - Single Handed Sailor
INSERT INTO Artists (name, bio, country, debut_year)
SELECT 'Dire Straits', NULL, 'UK', 1978
WHERE NOT EXISTS (SELECT 1 FROM Artists WHERE name = 'Dire Straits');
SET @artist_id := (SELECT artist_id FROM Artists WHERE name = 'Dire Straits' LIMIT 1);
INSERT INTO Albums (title, release_date, genre, cover_url)
SELECT 'Communiqué', '1979-06-05', 'Rock', 'https://upload.wikimedia.org/wikipedia/en/9/98/Dire_Straits_Communique.jpg'
WHERE NOT EXISTS (SELECT 1 FROM Albums WHERE title = 'Communiqué');
SET @album_id := (SELECT album_id FROM Albums WHERE title = 'Communiqué' LIMIT 1);
INSERT INTO Songs (album_id, title, duration, language, file_url)
SELECT @album_id, 'Single Handed Sailor', '00:04:41', 'English', '/media/single_handed_sailor.mp3'
WHERE NOT EXISTS (SELECT 1 FROM Songs WHERE title = 'Single Handed Sailor' AND album_id = @album_id);
SET @song_id := (SELECT song_id FROM Songs WHERE title = 'Single Handed Sailor' AND album_id = @album_id LIMIT 1);
INSERT IGNORE INTO Song_Artists (song_id, artist_id, role) VALUES (@song_id, @artist_id, 'main');
INSERT IGNORE INTO Album_Artists (album_id, artist_id) VALUES (@album_id, @artist_id);

-- 5) Van Halen - Girl Gone Bad
INSERT INTO Artists (name, bio, country, debut_year)
SELECT 'Van Halen', NULL, 'USA', 1972
WHERE NOT EXISTS (SELECT 1 FROM Artists WHERE name = 'Van Halen');
SET @artist_id := (SELECT artist_id FROM Artists WHERE name = 'Van Halen' LIMIT 1);
INSERT INTO Albums (title, release_date, genre, cover_url)
SELECT '1984', '1984-01-09', 'Hard Rock', 'https://upload.wikimedia.org/wikipedia/en/8/8b/Van_Halen_-_1984.jpg'
WHERE NOT EXISTS (SELECT 1 FROM Albums WHERE title = '1984');
SET @album_id := (SELECT album_id FROM Albums WHERE title = '1984' LIMIT 1);
INSERT INTO Songs (album_id, title, duration, language, file_url)
SELECT @album_id, 'Girl Gone Bad', '00:04:35', 'English', '/media/girl_gone_bad.mp3'
WHERE NOT EXISTS (SELECT 1 FROM Songs WHERE title = 'Girl Gone Bad' AND album_id = @album_id);
SET @song_id := (SELECT song_id FROM Songs WHERE title = 'Girl Gone Bad' AND album_id = @album_id LIMIT 1);
INSERT IGNORE INTO Song_Artists (song_id, artist_id, role) VALUES (@song_id, @artist_id, 'main');
INSERT IGNORE INTO Album_Artists (album_id, artist_id) VALUES (@album_id, @artist_id);

-- 6) The Police - Every Breath You Take
INSERT INTO Artists (name, bio, country, debut_year)
SELECT 'The Police', NULL, 'UK', 1977
WHERE NOT EXISTS (SELECT 1 FROM Artists WHERE name = 'The Police');
SET @artist_id := (SELECT artist_id FROM Artists WHERE name = 'The Police' LIMIT 1);
INSERT INTO Albums (title, release_date, genre, cover_url)
SELECT 'Synchronicity', '1983-06-17', 'New Wave', 'https://upload.wikimedia.org/wikipedia/en/8/8d/Police-album-synchronicity.jpg'
WHERE NOT EXISTS (SELECT 1 FROM Albums WHERE title = 'Synchronicity');
SET @album_id := (SELECT album_id FROM Albums WHERE title = 'Synchronicity' LIMIT 1);
INSERT INTO Songs (album_id, title, duration, language, file_url)
SELECT @album_id, 'Every Breath You Take', '00:04:13', 'English', '/media/every_breath_you_take.mp3'
WHERE NOT EXISTS (SELECT 1 FROM Songs WHERE title = 'Every Breath You Take' AND album_id = @album_id);
SET @song_id := (SELECT song_id FROM Songs WHERE title = 'Every Breath You Take' AND album_id = @album_id LIMIT 1);
INSERT IGNORE INTO Song_Artists (song_id, artist_id, role) VALUES (@song_id, @artist_id, 'main');
INSERT IGNORE INTO Album_Artists (album_id, artist_id) VALUES (@album_id, @artist_id);

-- 7) Pink Floyd - High Hopes
INSERT INTO Artists (name, bio, country, debut_year)
SELECT 'Pink Floyd', NULL, 'UK', 1965
WHERE NOT EXISTS (SELECT 1 FROM Artists WHERE name = 'Pink Floyd');
SET @artist_id := (SELECT artist_id FROM Artists WHERE name = 'Pink Floyd' LIMIT 1);
INSERT INTO Albums (title, release_date, genre, cover_url)
SELECT 'The Division Bell', '1994-03-28', 'Progressive Rock', 'https://upload.wikimedia.org/wikipedia/en/5/5c/Divisionbell.jpg'
WHERE NOT EXISTS (SELECT 1 FROM Albums WHERE title = 'The Division Bell');
SET @album_id := (SELECT album_id FROM Albums WHERE title = 'The Division Bell' LIMIT 1);
INSERT INTO Songs (album_id, title, duration, language, file_url)
SELECT @album_id, 'High Hopes', '00:07:00', 'English', '/media/high_hopes.mp3'
WHERE NOT EXISTS (SELECT 1 FROM Songs WHERE title = 'High Hopes' AND album_id = @album_id);
SET @song_id := (SELECT song_id FROM Songs WHERE title = 'High Hopes' AND album_id = @album_id LIMIT 1);
INSERT IGNORE INTO Song_Artists (song_id, artist_id, role) VALUES (@song_id, @artist_id, 'main');
INSERT IGNORE INTO Album_Artists (album_id, artist_id) VALUES (@album_id, @artist_id);

-- 8) Oasis - Whatever
INSERT INTO Artists (name, bio, country, debut_year)
SELECT 'Oasis', NULL, 'UK', 1991
WHERE NOT EXISTS (SELECT 1 FROM Artists WHERE name = 'Oasis');
SET @artist_id := (SELECT artist_id FROM Artists WHERE name = 'Oasis' LIMIT 1);
INSERT INTO Albums (title, release_date, genre, cover_url)
SELECT 'Whatever - Single', '1994-12-18', 'Rock', 'https://upload.wikimedia.org/wikipedia/en/1/1d/Whatevercover.jpg'
WHERE NOT EXISTS (SELECT 1 FROM Albums WHERE title = 'Whatever - Single');
SET @album_id := (SELECT album_id FROM Albums WHERE title = 'Whatever - Single' LIMIT 1);
INSERT INTO Songs (album_id, title, duration, language, file_url)
SELECT @album_id, 'Whatever', '00:06:21', 'English', '/media/whatever.mp3'
WHERE NOT EXISTS (SELECT 1 FROM Songs WHERE title = 'Whatever' AND album_id = @album_id);
SET @song_id := (SELECT song_id FROM Songs WHERE title = 'Whatever' AND album_id = @album_id LIMIT 1);
INSERT IGNORE INTO Song_Artists (song_id, artist_id, role) VALUES (@song_id, @artist_id, 'main');
INSERT IGNORE INTO Album_Artists (album_id, artist_id) VALUES (@album_id, @artist_id);

-- 9) Oasis - Hello
INSERT INTO Artists (name, bio, country, debut_year)
SELECT 'Oasis', NULL, 'UK', 1991
WHERE NOT EXISTS (SELECT 1 FROM Artists WHERE name = 'Oasis');
SET @artist_id := (SELECT artist_id FROM Artists WHERE name = 'Oasis' LIMIT 1);
INSERT INTO Albums (title, release_date, genre, cover_url)
SELECT "(What's the Story) Morning Glory?", '1995-10-02', 'Rock', 'https://upload.wikimedia.org/wikipedia/en/b/b1/Oasis_-_%28What%27s_The_Story%29_Morning_Glory_album_cover.jpg'
WHERE NOT EXISTS (SELECT 1 FROM Albums WHERE title = "(What's the Story) Morning Glory?");
SET @album_id := (SELECT album_id FROM Albums WHERE title = "(What's the Story) Morning Glory?" LIMIT 1);
INSERT INTO Songs (album_id, title, duration, language, file_url)
SELECT @album_id, 'Hello', '00:03:21', 'English', '/media/hello.mp3'
WHERE NOT EXISTS (SELECT 1 FROM Songs WHERE title = 'Hello' AND album_id = @album_id);
SET @song_id := (SELECT song_id FROM Songs WHERE title = 'Hello' AND album_id = @album_id LIMIT 1);
INSERT IGNORE INTO Song_Artists (song_id, artist_id, role) VALUES (@song_id, @artist_id, 'main');
INSERT IGNORE INTO Album_Artists (album_id, artist_id) VALUES (@album_id, @artist_id);

-- 10) The Alan Parsons Project - The Turn of a Friendly Card (Part 2)
INSERT INTO Artists (name, bio, country, debut_year)
SELECT 'The Alan Parsons Project', NULL, 'UK', 1975
WHERE NOT EXISTS (SELECT 1 FROM Artists WHERE name = 'The Alan Parsons Project');
SET @artist_id := (SELECT artist_id FROM Artists WHERE name = 'The Alan Parsons Project' LIMIT 1);
INSERT INTO Albums (title, release_date, genre, cover_url)
SELECT 'The Turn of a Friendly Card', '1980-11-07', 'Progressive Rock', 'https://upload.wikimedia.org/wikipedia/en/e/e6/The_Alan_Parsons_Project_-_The_Turn_of_a_Friendly_Card.jpg'
WHERE NOT EXISTS (SELECT 1 FROM Albums WHERE title = 'The Turn of a Friendly Card');
SET @album_id := (SELECT album_id FROM Albums WHERE title = 'The Turn of a Friendly Card' LIMIT 1);
INSERT INTO Songs (album_id, title, duration, language, file_url)
SELECT @album_id, 'The Turn of a Friendly Card (Part 2)', '00:03:21', 'English', '/media/the_turn_of_a_friendly_card_pt2.mp3'
WHERE NOT EXISTS (SELECT 1 FROM Songs WHERE title = 'The Turn of a Friendly Card (Part 2)' AND album_id = @album_id);
SET @song_id := (SELECT song_id FROM Songs WHERE title = 'The Turn of a Friendly Card (Part 2)' AND album_id = @album_id LIMIT 1);
INSERT IGNORE INTO Song_Artists (song_id, artist_id, role) VALUES (@song_id, @artist_id, 'main');
INSERT IGNORE INTO Album_Artists (album_id, artist_id) VALUES (@album_id, @artist_id);

-- 11) The Beatles - Octopus's Garden
INSERT INTO Artists (name, bio, country, debut_year)
SELECT 'The Beatles', NULL, 'UK', 1960
WHERE NOT EXISTS (SELECT 1 FROM Artists WHERE name = 'The Beatles');
SET @artist_id := (SELECT artist_id FROM Artists WHERE name = 'The Beatles' LIMIT 1);
INSERT INTO Albums (title, release_date, genre, cover_url)
SELECT 'Abbey Road', '1969-09-26', 'Rock', 'https://upload.wikimedia.org/wikipedia/en/4/42/Beatles_-_Abbey_Road.jpg'
WHERE NOT EXISTS (SELECT 1 FROM Albums WHERE title = 'Abbey Road');
SET @album_id := (SELECT album_id FROM Albums WHERE title = 'Abbey Road' LIMIT 1);
INSERT INTO Songs (album_id, title, duration, language, file_url)
SELECT @album_id, "Octopus's Garden", '00:02:51', 'English', '/media/octopus_garden.mp3'
WHERE NOT EXISTS (SELECT 1 FROM Songs WHERE title = "Octopus's Garden" AND album_id = @album_id);
SET @song_id := (SELECT song_id FROM Songs WHERE title = "Octopus's Garden" AND album_id = @album_id LIMIT 1);
INSERT IGNORE INTO Song_Artists (song_id, artist_id, role) VALUES (@song_id, @artist_id, 'main');
INSERT IGNORE INTO Album_Artists (album_id, artist_id) VALUES (@album_id, @artist_id);

-- ==========================================
-- 13) Tame Impala - Dracula
-- ==========================================
INSERT INTO Artists (name, bio, country, debut_year)
SELECT 'Tame Impala', NULL, 'Australia', 2007
WHERE NOT EXISTS (SELECT 1 FROM Artists WHERE name = 'Tame Impala');

SET @artist_id := (SELECT artist_id FROM Artists WHERE name = 'Tame Impala' LIMIT 1);

INSERT INTO Albums (title, release_date, genre, cover_url)
SELECT 'B-Sides & Remixes', NULL, 'Psychedelic Rock', NULL
WHERE NOT EXISTS (SELECT 1 FROM Albums WHERE title = 'B-Sides & Remixes');

SET @album_id := (SELECT album_id FROM Albums WHERE title = 'B-Sides & Remixes' LIMIT 1);

INSERT INTO Songs (album_id, title, duration, language, file_url)
SELECT @album_id, 'Dracula', '00:03:29', 'English', '/media/dracula.mp3'
WHERE NOT EXISTS (SELECT 1 FROM Songs WHERE title = 'Dracula' AND album_id = @album_id);

SET @song_id := (SELECT song_id FROM Songs WHERE title = 'Dracula' AND album_id = @album_id LIMIT 1);

INSERT IGNORE INTO Song_Artists VALUES (@song_id, @artist_id, 'main');
INSERT IGNORE INTO Album_Artists VALUES (@album_id, @artist_id);

-- ==========================================
-- 14) Tame Impala - New Person, Same Old Mistakes
-- ==========================================
INSERT INTO Albums (title, release_date, genre, cover_url)
SELECT 'Currents', '2015-07-17', 'Psychedelic Rock', NULL
WHERE NOT EXISTS (SELECT 1 FROM Albums WHERE title = 'Currents');

SET @album_id := (SELECT album_id FROM Albums WHERE title = 'Currents' LIMIT 1);

INSERT INTO Songs (album_id, title, duration, language, file_url)
SELECT @album_id, 'New Person, Same Old Mistakes', '00:06:03', 'English', '/media/new_person_same_old_mistakes.mp3'
WHERE NOT EXISTS (SELECT 1 FROM Songs WHERE title = 'New Person, Same Old Mistakes' AND album_id = @album_id);

SET @song_id := (SELECT song_id FROM Songs WHERE title = 'New Person, Same Old Mistakes' AND album_id = @album_id LIMIT 1);

INSERT IGNORE INTO Song_Artists VALUES (@song_id, @artist_id, 'main');
INSERT IGNORE INTO Album_Artists VALUES (@album_id, @artist_id);


USE music_streaming;

-- 1) Ensure artist exists (create if missing), then capture id
INSERT INTO Artists (name, bio, country, debut_year)
SELECT 'Jain', NULL, 'France', 2015
WHERE NOT EXISTS (SELECT 1 FROM Artists WHERE name = 'Jain');

SET @artist_id := (SELECT artist_id FROM Artists WHERE name = 'Jain' LIMIT 1);

-- 2) Ensure album exists (create if missing), then capture id
INSERT INTO Albums (title, release_date, genre, cover_url)
SELECT 'Zanaka', '2015-11-06', 'Pop', 'https://upload.wikimedia.org/wikipedia/en/f/f8/Jain_-_Zanaka.png'
WHERE NOT EXISTS (SELECT 1 FROM Albums WHERE title = 'Zanaka');

SET @album_id := (SELECT album_id FROM Albums WHERE title = 'Zanaka' LIMIT 1);

-- 3) Ensure song exists (create if missing), then capture id
INSERT INTO Songs (album_id, title, duration, language, file_url)
SELECT @album_id, 'Makeba', '00:03:36', 'English', '/media/makeba.mp3'
WHERE NOT EXISTS (
  SELECT 1 FROM Songs
  WHERE title = 'Makeba' AND album_id = @album_id
);

SET @song_id := (
  SELECT song_id FROM Songs
  WHERE title = 'Makeba' AND album_id = @album_id
  LIMIT 1
);

-- 4) Link song <-> artist
INSERT IGNORE INTO Song_Artists (song_id, artist_id, role)
VALUES (@song_id, @artist_id, 'main');

-- 5) Link album <-> artist
INSERT IGNORE INTO Album_Artists (album_id, artist_id)
VALUES (@album_id, @artist_id);

