-- MySQL dump 10.13  Distrib 8.0.44, for macos15 (arm64)
--
-- Host: localhost    Database: music_streaming
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Album_Artists`
--

DROP TABLE IF EXISTS `Album_Artists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Album_Artists` (
  `album_id` int NOT NULL,
  `artist_id` int NOT NULL,
  PRIMARY KEY (`album_id`,`artist_id`),
  KEY `fk_album_artists_artist` (`artist_id`),
  CONSTRAINT `fk_album_artists_album` FOREIGN KEY (`album_id`) REFERENCES `Albums` (`album_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_album_artists_artist` FOREIGN KEY (`artist_id`) REFERENCES `Artists` (`artist_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Album_Artists`
--

LOCK TABLES `Album_Artists` WRITE;
/*!40000 ALTER TABLE `Album_Artists` DISABLE KEYS */;
/*!40000 ALTER TABLE `Album_Artists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Albums`
--

DROP TABLE IF EXISTS `Albums`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Albums` (
  `album_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `release_date` date DEFAULT NULL,
  `genre` varchar(50) DEFAULT NULL,
  `cover_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`album_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Albums`
--

LOCK TABLES `Albums` WRITE;
/*!40000 ALTER TABLE `Albums` DISABLE KEYS */;
/*!40000 ALTER TABLE `Albums` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Artists`
--

DROP TABLE IF EXISTS `Artists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Artists` (
  `artist_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `bio` text,
  `country` varchar(50) DEFAULT NULL,
  `debut_year` int DEFAULT NULL,
  PRIMARY KEY (`artist_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Artists`
--

LOCK TABLES `Artists` WRITE;
/*!40000 ALTER TABLE `Artists` DISABLE KEYS */;
/*!40000 ALTER TABLE `Artists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Likes`
--

DROP TABLE IF EXISTS `Likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Likes` (
  `user_id` int NOT NULL,
  `song_id` int NOT NULL,
  `liked_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`song_id`),
  KEY `song_id` (`song_id`),
  CONSTRAINT `likes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `likes_ibfk_2` FOREIGN KEY (`song_id`) REFERENCES `Songs` (`song_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Likes`
--

LOCK TABLES `Likes` WRITE;
/*!40000 ALTER TABLE `Likes` DISABLE KEYS */;
/*!40000 ALTER TABLE `Likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Listening_History`
--

DROP TABLE IF EXISTS `Listening_History`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Listening_History` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `song_id` int DEFAULT NULL,
  `listened_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `device` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`history_id`),
  KEY `user_id` (`user_id`),
  KEY `song_id` (`song_id`),
  CONSTRAINT `listening_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `listening_history_ibfk_2` FOREIGN KEY (`song_id`) REFERENCES `Songs` (`song_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Listening_History`
--

LOCK TABLES `Listening_History` WRITE;
/*!40000 ALTER TABLE `Listening_History` DISABLE KEYS */;
/*!40000 ALTER TABLE `Listening_History` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Payments`
--

DROP TABLE IF EXISTS `Payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Payments` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `amount` decimal(8,2) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`payment_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Payments`
--

LOCK TABLES `Payments` WRITE;
/*!40000 ALTER TABLE `Payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `Payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Playlist_Songs`
--

DROP TABLE IF EXISTS `Playlist_Songs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Playlist_Songs` (
  `playlist_id` int NOT NULL,
  `song_id` int NOT NULL,
  `added_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`playlist_id`,`song_id`),
  KEY `song_id` (`song_id`),
  CONSTRAINT `playlist_songs_ibfk_1` FOREIGN KEY (`playlist_id`) REFERENCES `Playlists` (`playlist_id`) ON DELETE CASCADE,
  CONSTRAINT `playlist_songs_ibfk_2` FOREIGN KEY (`song_id`) REFERENCES `Songs` (`song_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Playlist_Songs`
--

LOCK TABLES `Playlist_Songs` WRITE;
/*!40000 ALTER TABLE `Playlist_Songs` DISABLE KEYS */;
/*!40000 ALTER TABLE `Playlist_Songs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Playlists`
--

DROP TABLE IF EXISTS `Playlists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Playlists` (
  `playlist_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `title` varchar(100) NOT NULL,
  `description` text,
  `is_public` tinyint(1) DEFAULT '1',
  `date_created` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`playlist_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `playlists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Playlists`
--

LOCK TABLES `Playlists` WRITE;
/*!40000 ALTER TABLE `Playlists` DISABLE KEYS */;
/*!40000 ALTER TABLE `Playlists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Song_Artists`
--

DROP TABLE IF EXISTS `Song_Artists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Song_Artists` (
  `song_id` int NOT NULL,
  `artist_id` int NOT NULL,
  `role` enum('main','featured','remixer') DEFAULT 'main',
  PRIMARY KEY (`song_id`,`artist_id`),
  KEY `fk_song_artists_artist` (`artist_id`),
  CONSTRAINT `fk_song_artists_artist` FOREIGN KEY (`artist_id`) REFERENCES `Artists` (`artist_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_song_artists_song` FOREIGN KEY (`song_id`) REFERENCES `Songs` (`song_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Song_Artists`
--

LOCK TABLES `Song_Artists` WRITE;
/*!40000 ALTER TABLE `Song_Artists` DISABLE KEYS */;
/*!40000 ALTER TABLE `Song_Artists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Songs`
--

DROP TABLE IF EXISTS `Songs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Songs` (
  `song_id` int NOT NULL AUTO_INCREMENT,
  `album_id` int DEFAULT NULL,
  `title` varchar(100) NOT NULL,
  `duration` time DEFAULT NULL,
  `language` varchar(50) DEFAULT NULL,
  `file_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`song_id`),
  KEY `album_id` (`album_id`),
  CONSTRAINT `songs_ibfk_1` FOREIGN KEY (`album_id`) REFERENCES `Albums` (`album_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Songs`
--

LOCK TABLES `Songs` WRITE;
/*!40000 ALTER TABLE `Songs` DISABLE KEYS */;
/*!40000 ALTER TABLE `Songs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `country` varchar(50) DEFAULT NULL,
  `date_joined` datetime DEFAULT CURRENT_TIMESTAMP,
  `subscription_type` enum('free','premium') DEFAULT 'free',
  `is_admin` boolean DEFAULT FALSE,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Users`
--

LOCK TABLES `Users` WRITE;
/*!40000 ALTER TABLE `Users` DISABLE KEYS */;
INSERT INTO `Users` (`user_id`, `username`, `email`, `password_hash`, `country`, `date_joined`, `subscription_type`, `is_admin`) VALUES
  (1, 'PremiumUser', 'premium@test.com', 'hash123', NULL, '2025-10-31 23:32:01', 'premium', 0),
  (2, 'FreeUser', 'free@test.com', 'hash123', NULL, '2025-10-31 23:32:01', 'free', 0),
  (3, 'AdminUser', 'admin@test.com', 'hash_admin', NULL, '2025-11-07 00:00:00', 'premium', 1);
/*!40000 ALTER TABLE `Users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Add streaming limit columns and functionality
--

-- Add columns if they don't exist
ALTER TABLE Users 
ADD COLUMN is_allowed_to_stream BOOLEAN DEFAULT TRUE,
ADD COLUMN songs_streamed INT DEFAULT 0;

-- Drop any existing trigger and create a single trigger that updates counts for all users
DROP TRIGGER IF EXISTS trg_update_songs_streamed;

DELIMITER $$

CREATE TRIGGER trg_update_songs_streamed
AFTER INSERT ON Listening_History
FOR EACH ROW
BEGIN
  -- Increment total streams for every user
  UPDATE Users
  SET songs_streamed = COALESCE(songs_streamed, 0) + 1
  WHERE user_id = NEW.user_id;

  -- Enforce free-user daily cap (10); premium users remain allowed
  UPDATE Users u
  JOIN (
    SELECT subscription_type, songs_streamed
    FROM Users
    WHERE user_id = NEW.user_id
  ) t ON u.user_id = NEW.user_id
  SET u.is_allowed_to_stream = CASE
    WHEN t.subscription_type = 'free' AND t.songs_streamed >= 10 THEN FALSE
    ELSE TRUE
  END;
END$$

DELIMITER ;

-- Enable event scheduler
SET GLOBAL event_scheduler = ON;

-- Drop existing event if it exists
DROP EVENT IF EXISTS reset_free_user_streams;

-- Create the reset event
CREATE EVENT reset_free_user_streams
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
    UPDATE Users
    SET songs_streamed = 0, is_allowed_to_stream = TRUE
    WHERE subscription_type = 'free';

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

-- duplicate conditional trigger block removed
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Add user statistics procedure
DELIMITER //

CREATE PROCEDURE get_user_listening_stats(
    IN user_id INT
)
BEGIN
    -- Get total listening time and top genres for a user
    SELECT 
        u.username,
        COUNT(DISTINCT h.song_id) as unique_songs_played,
        COUNT(h.song_id) as total_plays,
        SEC_TO_TIME(SUM(TIME_TO_SEC(s.duration))) as total_listening_time,
        GROUP_CONCAT(DISTINCT s.language ORDER BY s.language SEPARATOR ', ') as languages_listened,
        (SELECT COUNT(*) FROM Playlists WHERE user_id = u.user_id) as playlist_count,
        (SELECT COUNT(*) FROM Likes WHERE user_id = u.user_id) as likes_count
    FROM Users u
    LEFT JOIN Listening_History h ON u.user_id = h.user_id
    LEFT JOIN Songs s ON h.song_id = s.song_id
    WHERE u.user_id = user_id
    GROUP BY u.user_id;
END//

DELIMITER ;

-- Dump completed on 2025-10-31 23:54:37

-- ======================================================================
-- Analytic views and helper function
-- These views make common analytics queries simple to run from the backend
-- ======================================================================

-- 1) Top artists by total plays (aggregates Listening_History via song -> song_artists -> artists)
CREATE OR REPLACE VIEW view_top_artists_by_plays AS
SELECT
  ar.artist_id,
  ar.name AS artist_name,
  COUNT(l.history_id) AS play_count
FROM Listening_History l
JOIN Songs s ON l.song_id = s.song_id
JOIN Song_Artists sa ON s.song_id = sa.song_id
JOIN Artists ar ON sa.artist_id = ar.artist_id
GROUP BY ar.artist_id, ar.name
ORDER BY play_count DESC;

-- 2) Top albums by streams
CREATE OR REPLACE VIEW view_top_albums_by_streams AS
SELECT
  al.album_id,
  al.title AS album_title,
  al.release_date,
  COUNT(l.history_id) AS play_count
FROM Listening_History l
JOIN Songs s ON l.song_id = s.song_id
JOIN Albums al ON s.album_id = al.album_id
GROUP BY al.album_id, al.title, al.release_date
ORDER BY play_count DESC;

-- 3) Active users in the last 7 days (total plays and unique songs listened)
CREATE OR REPLACE VIEW view_active_users_last_7_days AS
SELECT
  u.user_id,
  u.username,
  COUNT(l.history_id) AS total_plays_last_7_days,
  COUNT(DISTINCT l.song_id) AS unique_songs_last_7_days
FROM Users u
LEFT JOIN Listening_History l ON u.user_id = l.user_id AND l.listened_at >= NOW() - INTERVAL 7 DAY
GROUP BY u.user_id, u.username
HAVING total_plays_last_7_days > 0
ORDER BY total_plays_last_7_days DESC;

-- 4) Recently added songs with artist and album metadata (useful for admin 'recent uploads')
CREATE OR REPLACE VIEW view_recent_songs_with_metadata AS
SELECT
  s.song_id,
  s.title,
  s.file_url,
  TIME_FORMAT(s.duration, '%H:%i:%s') AS duration,
  s.language,
  al.album_id,
  al.title AS album_title,
  al.release_date AS album_release_date,
  al.cover_url AS album_cover_url,
  -- pick first artist (main) and aggregate others into a list
  SUBSTRING_INDEX(GROUP_CONCAT(DISTINCT ar.name ORDER BY CASE WHEN sa.role = 'main' THEN 0 ELSE 1 END SEPARATOR ', '), ', ', 1) AS main_artist,
  GROUP_CONCAT(DISTINCT ar.name ORDER BY CASE WHEN sa.role = 'main' THEN 0 ELSE 1 END SEPARATOR ', ') AS all_artists
FROM Songs s
LEFT JOIN Albums al ON s.album_id = al.album_id
LEFT JOIN Song_Artists sa ON s.song_id = sa.song_id
LEFT JOIN Artists ar ON sa.artist_id = ar.artist_id
GROUP BY s.song_id, s.title, s.file_url, s.duration, s.language, al.album_id, al.title, al.release_date, al.cover_url
ORDER BY s.song_id DESC;

-- 5) Genre and language distribution across songs (by album genre and song language)
CREATE OR REPLACE VIEW view_genre_language_distribution AS
SELECT
  COALESCE(al.genre, 'unknown') AS album_genre,
  COALESCE(s.language, 'unknown') AS song_language,
  COUNT(s.song_id) AS song_count
FROM Songs s
LEFT JOIN Albums al ON s.album_id = al.album_id
GROUP BY COALESCE(al.genre, 'unknown'), COALESCE(s.language, 'unknown')
ORDER BY song_count DESC;

-- Stored function: return total songs in playlist
DELIMITER $$
CREATE FUNCTION get_playlist_song_count(p_playlist_id INT)
RETURNS INT DETERMINISTIC
BEGIN
  DECLARE cnt INT DEFAULT 0;
  SELECT COUNT(*) INTO cnt FROM Playlist_Songs WHERE playlist_id = p_playlist_id;
  RETURN COALESCE(cnt, 0);
END$$
DELIMITER ;


