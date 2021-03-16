-- MySQL Workbench Forward Engineering
SET
  @OLD_UNIQUE_CHECKS = @@UNIQUE_CHECKS,
  UNIQUE_CHECKS = 0;
SET
  @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS,
  FOREIGN_KEY_CHECKS = 0;
SET
  @OLD_SQL_MODE = @@SQL_MODE,
  SQL_MODE = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
-- -----------------------------------------------------
  -- Schema mydb
  -- -----------------------------------------------------
  -- -----------------------------------------------------
  -- Schema staging
  -- -----------------------------------------------------
  DROP SCHEMA IF EXISTS `staging`;
-- -----------------------------------------------------
  -- Schema staging
  -- -----------------------------------------------------
  CREATE SCHEMA IF NOT EXISTS `staging` DEFAULT CHARACTER SET utf8;
USE `staging`;
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`HACKATHONS` (
    `hackathon_id` VARCHAR(45) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `start_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `end_time` TIMESTAMP NULL DEFAULT NULL,
    `base_pin` INT(11) NOT NULL,
    `active` TINYINT(1) NOT NULL,
    PRIMARY KEY (`hackathon_id`)
)  ENGINE=INNODB DEFAULT CHARACTER SET=LATIN1;
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`BUDGET_ITEMS` (
    `budget_id` VARCHAR(45) NOT NULL,
    `team` ENUM('communication', 'design', 'education', 'entertainment', 'finance', 'logistics', 'marketing', 'sponsorship', 'technology') NOT NULL,
    `item_name` LONGTEXT NOT NULL,
    `price` FLOAT NOT NULL,
    `quantity` INT(10) UNSIGNED NOT NULL,
    `vendor` LONGTEXT NOT NULL,
    `hackathon_id` VARCHAR(45) NOT NULL,
    `accepted` TINYINT(4) NOT NULL DEFAULT '0',
    PRIMARY KEY (`budget_id`),
    INDEX `fk_budget_item_hackathon_id_idx` (`hackathon_id` ASC),
    INDEX `idx_team` (`team` ASC),
    CONSTRAINT `fk_budget_item_hackathon_id` FOREIGN KEY (`hackathon_id`)
        REFERENCES `staging`.`HACKATHONS` (`hackathon_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT
)  ENGINE=INNODB DEFAULT CHARACTER SET=LATIN1;
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`CATEGORY_LIST` (
    `category_id` VARCHAR(45) NOT NULL,
    `name` VARCHAR(100),
    `is_sponsor` TINYINT(1),
    `hackathon_id` VARCHAR(45) NOT NULL,
    PRIMARY KEY (`category_id`),
    UNIQUE INDEX `category_name_uniq` (`name` ASC),
    INDEX `fk_category_id_hackathon_id_idx` (`hackathon_id` ASC),
    CONSTRAINT `fk_category_id_hackathon_id_idx` FOREIGN KEY (`hackathon_id`)
        REFERENCES `staging`.`HACKATHONS` (`hackathon_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT
)  ENGINE=INNODB DEFAULT CHARACTER SET=LATIN1;
-- -----------------------------------------------------
-- Table `staging`.`CHECKOUT_ITEMS`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`CHECKOUT_ITEMS` (
    `chitem_id` VARCHAR(11) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `quantity` INT(11) NOT NULL,
    `hackathon_id` VARCHAR(45) NOT NULL,
    PRIMARY KEY (`chitem_id`),
    INDEX `fk_chitem_id_hackathon_id_idx` (`hackathon_id` ASC),
    CONSTRAINT `fk_chitem_id_hackathon_id_idx` FOREIGN KEY (`hackathon_id`)
        REFERENCES `staging`.`HACKATHONS` (`hackathon_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT
)  ENGINE=INNODB DEFAULT CHARACTER SET=LATIN1;
-- -----------------------------------------------------
-- Table `staging`.`REGISTRATION`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`REGISTRATIONS` (
    `user_id` VARCHAR(45) NOT NULL,
    `firstname` VARCHAR(45) NOT NULL,
    `lastname` VARCHAR(45) NOT NULL,
    `gender` ENUM('male', 'female', 'non-binary', 'no-disclose') NOT NULL,
    `eighteen_before_event` TINYINT(4) NOT NULL DEFAULT 1,
    `shirt_size` ENUM('XS', 'S', 'M', 'L', 'XL', 'XXL') NULL DEFAULT NULL,
    `dietary_restriction` VARCHAR(255) NULL DEFAULT NULL,
    `allergies` LONGTEXT NULL DEFAULT NULL,
    `travel_reimbursement` TINYINT(4) NOT NULL DEFAULT '0',
    `first_hackathon` TINYINT(4) NULL DEFAULT '0',
    `university` VARCHAR(200) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `academic_year` ENUM('freshman', 'sophomore', 'junior', 'senior', 'graduate', 'other') NULL DEFAULT NULL,
    `major` VARCHAR(100) NULL DEFAULT NULL,
    `resume` VARCHAR(2083) NULL DEFAULT NULL,
    `mlh_coc` TINYINT(4) NOT NULL DEFAULT 1,
    `mlh_dcp` TINYINT(4) NOT NULL DEFAULT 1,
    `phone` VARCHAR(50) NOT NULL,
    `race` VARCHAR(150) NULL DEFAULT NULL,
    `coding_experience` ENUM('none', 'beginner', 'intermediate', 'advanced', 'god') NULL DEFAULT 'none',
    `referral` TEXT NULL DEFAULT NULL,
    `project` LONGTEXT NULL DEFAULT NULL,
    `submitted` TINYINT(4) NOT NULL DEFAULT '0',
    `expectations` LONGTEXT NULL DEFAULT NULL,
    `veteran` VARCHAR(15) NULL DEFAULT 'false',
    `pin` INT(11) NOT NULL AUTO_INCREMENT,
    `time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `hackathon_id` VARCHAR(45) NOT NULL,
    PRIMARY KEY (`user_id` , `hackathon_id`),
    UNIQUE INDEX `uniq_pin` (`pin` ASC),
    INDEX `fk_user_id_hackathon_id_idx` (`hackathon_id` ASC),
    CONSTRAINT `fk_user_id_hackathon_id_idx` FOREIGN KEY (`hackathon_id`)
        REFERENCES `staging`.`HACKATHONS` (`hackathon_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT
)  ENGINE=INNODB DEFAULT CHARACTER SET=LATIN1;
-- -----------------------------------------------------
-- Table `staging`.`CHECKOUT_DATA`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`CHECKOUT_DATA` (
    `chdata_id` VARCHAR(45) NOT NULL,
    `chitem_id` VARCHAR(45) NOT NULL,
    `user_id` VARCHAR(45) NOT NULL,
    `checkout_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `return_time` TIMESTAMP NULL DEFAULT NULL,
    `hackathon_id` VARCHAR(45) NOT NULL,
    PRIMARY KEY (`chdata_id`),
    INDEX `fk_chdata_chitem_id_idx` (`chitem_id` ASC),
    INDEX `fk_chdata_user_id_idx` (`user_id` ASC),
    INDEX `fk_chdata_hackathon_id_idx` (`hackathon_id` ASC),
    CONSTRAINT `fk_chdata_hackathon_id_idx` FOREIGN KEY (`hackathon_id`)
        REFERENCES `staging`.`HACKATHONS` (`hackathon_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `fk_chdata_user_id_idx` FOREIGN KEY (`user_id`)
        REFERENCES `staging`.`REGISTRATIONS` (`user_id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_chdata_chitem_id_idx` FOREIGN KEY (`chitem_id`)
        REFERENCES `staging`.`CHECKOUT_ITEMS` (`chitem_id`)
        ON DELETE CASCADE ON UPDATE CASCADE
)  ENGINE=INNODB DEFAULT CHARACTER SET=LATIN1;
-- -----------------------------------------------------
-- Table `staging`.`EMAIL_HISTORY`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`EMAIL_HISTORY` (
    `ehist_id` VARCHAR(45) NOT NULL,
    `sender` VARCHAR(45) NOT NULL,
    `recipient` VARCHAR(255) NOT NULL,
    `email_content` LONGTEXT NOT NULL,
    `subject` VARCHAR(500) NULL DEFAULT NULL,
    `recipient_name` VARCHAR(90) NOT NULL,
    `status` ENUM('0xC8', '0xCF') NOT NULL,
    `time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`ehist_id`)
)  ENGINE=INNODB DEFAULT CHARACTER SET=LATIN1;
-- -----------------------------------------------------
-- Table `staging`.`LOCATIONS`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`LOCATIONS` (
    `location_id` VARCHAR(45) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    PRIMARY KEY (`location_id`)
)  ENGINE=INNODB DEFAULT CHARACTER SET=LATIN1;
-- -----------------------------------------------------
-- Table `staginig`.`EVENTS`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`EVENTS` (
    `event_id` VARCHAR(45) NOT NULL,
    `location_id` VARCHAR(45) NOT NULL,
    `start_time` TIMESTAMP NOT NULL,
    `end_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `title` VARCHAR(400) NOT NULL,
    `description` LONGTEXT NULL DEFAULT NULL,
    `type` ENUM('food', 'workshop', 'activity') NOT NULL,
    `hackathon_id` VARCHAR(45) NOT NULL,
    PRIMARY KEY (`event_id`),
    INDEX `fk_events_location_id_idx` (`location_id` ASC),
    INDEX `fk_events_hackathon_id_idx` (`hackathon_id` ASC),
    CONSTRAINT `fk_events_hackathon_id_idx` FOREIGN KEY (`hackathon_id`)
        REFERENCES `staging`.`HACKATHONS` (`hackathon_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `fk_events_location_id_idx` FOREIGN KEY (`location_id`)
        REFERENCES `staging`.`LOCATIONS` (`location_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT
)  ENGINE=INNODB DEFAULT CHARACTER SET=LATIN1;
-- -----------------------------------------------------
-- Table `staging`.`EXTRA_CREDIT_CLASSES`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`EXTRA_CREDIT_CLASSES` (
    `ec_class_id` VARCHAR(45) NOT NULL,
    `name` VARCHAR(90) NOT NULL,
    `hackathon_id` VARCHAR(45) NOT NULL,
    PRIMARY KEY (`ec_class_id`),
    INDEX `fk_ec_classes_hackathon_id_idx` (`hackathon_id` ASC),
    CONSTRAINT `fk_ec_classes_hackathon_id_idx` FOREIGN KEY (`hackathon_id`)
        REFERENCES `staging`.`HACKATHONS` (`hackathon_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT
)  ENGINE=INNODB DEFAULT CHARACTER SET=LATIN1;
-- -----------------------------------------------------
-- Table `staging`.`EXTRA_CREDIT_ASSIGNMENT`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`EXTRA_CREDIT_ASSIGNMENT` (
    `ec_assign_id` VARCHAR(45) NOT NULL,
    `user_id` VARCHAR(45) NOT NULL,
    `ec_class_id` VARCHAR(45) NOT NULL,
    PRIMARY KEY (`ec_assign_id`),
    UNIQUE INDEX `uniq_user_class` (`user_id` ASC , `ec_class_id` ASC),
    INDEX `fk_ec_assign_user_id_idx` (`user_id` ASC),
    INDEX `fk_ec_assign_class_id_idx` (`ec_class_id` ASC),
    CONSTRAINT `fk_ec_assign_class_id_idx` FOREIGN KEY (`ec_class_id`)
        REFERENCES `staging`.`EXTRA_CREDIT_CLASSES` (`ec_class_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `fk_ec_assign_user_id_idx` FOREIGN KEY (`user_id`)
        REFERENCES `staging`.`REGISTRATIONS` (`user_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT
)  ENGINE=INNODB DEFAULT CHARACTER SET=LATIN1;
-- -----------------------------------------------------
-- Table `staging`.`PROJECT_LIST`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`PROJECT_LIST` (
    `proj_id` VARCHAR(45) NOT NULL,
    `name` VARCHAR(90) NOT NULL,
    `description` LONGTEXT DEFAULT NULL,
    `hackathon_id` VARCHAR(45) NOT NULL,
    PRIMARY KEY (`proj_id`),
    INDEX `fk_proj_list_hackathon_id_idx` (`hackathon_id` ASC),
    CONSTRAINT `fk_proj_list_hackathon_id_idx` FOREIGN KEY (`hackathon_id`)
        REFERENCES `staging`.`HACKATHONS` (`hackathon_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT
)  ENGINE=INNODB DEFAULT CHARACTER SET=LATIN1;
-- -----------------------------------------------------
-- Table `staging`.`PROJECT_CATEGORIES`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`PROJECT_CATEGORIES` (
    `proj_cat_id` VARCHAR(45) NOT NULL,
    `proj_id` VARCHAR(45) NOT NULL,
    `category_id` VARCHAR(45) NOT NULL,
    PRIMARY KEY (`proj_cat_id`),
    UNIQUE INDEX `uniq_cat_proj` (`proj_id` ASC , `category_id` ASC),
    INDEX `fk_proj_cat_id_fk` (`category_id` ASC),
    INDEX `fk_proj_cat_proj_list_id_fk` (`category_id` ASC),
    CONSTRAINT `fk_proj_cat_id_fk` FOREIGN KEY (`category_id`)
        REFERENCES `staging`.`CATEGORY_LIST` (`category_id`),
    CONSTRAINT `fk_proj_cat_proj_list_id_fk` FOREIGN KEY (`proj_id`)
        REFERENCES `staging`.`PROJECT_LIST` (`proj_id`)
)  ENGINE=INNODB DEFAULT CHARACTER SET=LATIN1;
-- -----------------------------------------------------
-- Table `staging`.`PROJECT_TEAMS`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`PROJECT_TEAMS` (
    `proj_team_id` VARCHAR(45) NOT NULL,
    `user_id` VARCHAR(45) NOT NULL,
    `proj_id` VARCHAR(45) NOT NULL,
    `hackathon_id` VARCHAR(45) NOT NULL,
    PRIMARY KEY (`proj_team_id`),
    UNIQUE INDEX `uniq_user_hack` (`user_id` ASC , `hackathon_id` ASC),
    UNIQUE INDEX `uniq_user_proj` (`user_id` ASC , `proj_id` ASC),
    INDEX `fk_team_proj_fk` (`proj_id` ASC),
    CONSTRAINT `fk_proj_team_proj_fk` FOREIGN KEY (`proj_id`)
        REFERENCES `staging`.`PROJECT_LIST` (`proj_id`),
    CONSTRAINT `fk_proj_team_hackathon_id_idx` FOREIGN KEY (`hackathon_id`)
        REFERENCES `staging`.`HACKATHONS` (`hackathon_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `fk_proj_team_user_id_idx` FOREIGN KEY (`user_id`)
        REFERENCES `staging`.`REGISTRATIONS` (`user_id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
)  ENGINE=INNODB DEFAULT CHARACTER SET=LATIN1;
-- -----------------------------------------------------
-- Table `staging`.`RECEIPTS`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`RECEIPTS` (
    `receipt_id` VARCHAR(45) NOT NULL,
    `url` LONGTEXT NOT NULL,
    `user_id` VARCHAR(45) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`receipt_id`)
)  ENGINE=INNODB DEFAULT CHARACTER SET=LATIN1;
-- -----------------------------------------------------
-- Table `staging`.`REIMBURSEMENTS`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`REIMBURSEMENTS` (
    `reimbursement_id` VARCHAR(45) NOT NULL,
    `type` ENUM('PURCHASE_ORDER', 'REIMBURSEMENT') NOT NULL,
    `mailing_address` LONGTEXT NOT NULL,
    `addl_details` LONGTEXT NOT NULL,
    `item_id` VARCHAR(45) NOT NULL,
    `user_id` VARCHAR(45) NOT NULL,
    `fullname` VARCHAR(90) NOT NULL,
    `cost` FLOAT NOT NULL,
    `receipt_id` VARCHAR(45) NOT NULL,
    `hackathon_id` VARCHAR(45) NOT NULL,
    PRIMARY KEY (`reimbursement_id`),
    INDEX `fk_reimbursement_item_id_idx` (`item_id` ASC),
    INDEX `fk_reimbursement_receipt_id_idx` (`receipt_id` ASC),
    INDEX `fk_reimbursement_hackathon_idx` (`hackathon_id` ASC),
    CONSTRAINT `fk_reimbursement_item_id` FOREIGN KEY (`item_id`)
        REFERENCES `staging`.`BUDGET_ITEMS` (`budget_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `fk_reimbursement_hackathon_idx` FOREIGN KEY (`hackathon_id`)
        REFERENCES `staging`.`HACKATHONS` (`hackathon_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `fk_reimbursement_receipt_id` FOREIGN KEY (`receipt_id`)
        REFERENCES `staging`.`RECEIPTS` (`receipt_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT
)  ENGINE=INNODB DEFAULT CHARACTER SET=LATIN1;
-- -----------------------------------------------------
-- Table `staging`.`RFID_ASSIGNMENTS`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`RFID_ASSIGNMENTS` (
    `rfid_id` VARCHAR(45) NOT NULL,
    `user_id` VARCHAR(45) NOT NULL,
    `time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `hackathon_id` VARCHAR(45) NOT NULL,
    PRIMARY KEY (`rfid_id`),
    INDEX `fk_rfid_assign_hackathon_idx` (`hackathon_id` ASC),
    INDEX `fk_rfid_assign_user_id_idx` (`user_id` ASC),
    CONSTRAINT `fk_rfid_assign_hackathon_idx` FOREIGN KEY (`hackathon_id`)
        REFERENCES `staging`.`HACKATHONS` (`hackathon_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `fk_rfid_assign_user_id_idx` FOREIGN KEY (`user_id`)
        REFERENCES `staging`.`REGISTRATIONS` (`user_id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
)  ENGINE=INNODB DEFAULT CHARACTER SET=LATIN1;
-- -----------------------------------------------------
-- Table `staging`.`RSVPS`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`RSVPS` (
    `rsvp_id` VARCHAR(45) NOT NULL,
    `user_id` VARCHAR(45) NOT NULL,
    `time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `status` TINYINT(4) NOT NULL,
    `hackathon_id` VARCHAR(45) NOT NULL,
    PRIMARY KEY (`rsvp_id`),
    INDEX `fk_rsvp_hackathon_id_idx` (`hackathon_id` ASC),
    INDEX `fk_rsvp_user_id_idx` (`user_id` ASC),
    CONSTRAINT `fk_rsvp_hackathon_id_idx` FOREIGN KEY (`hackathon_id`)
        REFERENCES `staging`.`HACKATHONS` (`hackathon_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `fk_rsvp_user_id_idx` FOREIGN KEY (`user_id`)
        REFERENCES `staging`.`REGISTRATIONS` (`user_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT
)  ENGINE=INNODB DEFAULT CHARACTER SET=LATIN1;
-- -----------------------------------------------------
-- Table `staging`.`SCANS`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`SCANS` (
    `scan_id` VARCHAR(45) NOT NULL,
    `rfid_id` VARCHAR(45) NOT NULL,
    `location_id` VARCHAR(45) NULL DEFAULT NULL,
    `time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `hackathon_id` VARCHAR(45) NOT NULL,
    `event_id` VARCHAR(45) NULL DEFAULT NULL,
    PRIMARY KEY (`scan_id`),
    INDEX `fk_scan_id_rfid_id_idx` (`rfid_id` ASC),
    INDEX `fk_scan_id_location_id_idx` (`location_id` ASC),
    INDEX `fk_scan_id_hackathon_id_idx` (`hackathon_id` ASC),
    INDEX `fk_scan_id_event_id_idx` (`event_id` ASC),
    CONSTRAINT `fk_scan_id_location_id_idx` FOREIGN KEY (`location_id`)
        REFERENCES `staging`.`LOCATIONS` (`location_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `fk_scan_id_rfid_id_idx` FOREIGN KEY (`rfid_id`)
        REFERENCES `staging`.`RFID_ASSIGNMENTS` (`rfid_id`)
        ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT `fk_scan_id_event_id_idx` FOREIGN KEY (`event_id`)
        REFERENCES `staging`.`EVENTS` (`event_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `fk_scan_id_hackathon_id_idx` FOREIGN KEY (`hackathon_id`)
        REFERENCES `staging`.`HACKATHONS` (`hackathon_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT
)  ENGINE=INNODB DEFAULT CHARACTER SET=LATIN1;
-- -----------------------------------------------------
-- Table `staging`.`TABLE_SUPPORT`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`TABLE_SUPPORT` (
    `tbl_support_id` VARCHAR(45) NOT NULL,
    `tbl_id` VARCHAR(45) NOT NULL,
    `category_id` VARCHAR(45) NOT NULL,
    `priority` INT(11) NOT NULL DEFAULT 1,
    `hackathon_id` VARCHAR(45) NOT NULL,
    PRIMARY KEY (`tbl_support_id`),
    UNIQUE INDEX `tbl_id_hackathon_id` (`tbl_id` ASC , `hackathon_id` ASC),
    INDEX `tbl_id` (`tbl_id` ASC),
    INDEX `fk_tbl_support_category_id_idx` (`category_id` ASC),
    INDEX `fk_tbl_support_hackathon_id_idx` (`hackathon_id` ASC),
    CONSTRAINT `fk_tbl_support_category_id_idx` FOREIGN KEY (`category_id`)
        REFERENCES `staging`.`CATEGORY_LIST` (`category_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `fk_tbl_support_hackathon_id_idx` FOREIGN KEY (`hackathon_id`)
        REFERENCES `staging`.`HACKATHONS` (`hackathon_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT
)  ENGINE=INNODB DEFAULT CHARACTER SET=LATIN1;
-- -----------------------------------------------------
-- Table `staging`.`TABLE_ASSIGNMENTS`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`TABLE_ASSIGNMENTS` (
    `tbl_assign_id` VARCHAR(45) NOT NULL,
    `tbl_id` VARCHAR(45) NOT NULL,
    `proj_id` VARCHAR(45) NOT NULL,
    `hackathon_id` VARCHAR(45) NOT NULL,
    PRIMARY KEY (`tbl_assign_id`),
    UNIQUE INDEX `tbl_id_hackathon_id` (`tbl_id` ASC , `hackathon_id` ASC),
    UNIQUE INDEX `proj_id_hackathon_id` (`proj_id` ASC , `hackathon_id` ASC),
    INDEX `fk_tbl_assign_tbl_id_idx` (`tbl_id` ASC),
    INDEX `fk_tbl_assign_proj_id_idx` (`proj_id` ASC),
    INDEX `fk_tbl_assign_hackathon_id_idx` (`hackathon_id` ASC),
    CONSTRAINT `fk_tbl_assign_tbl_id_idx` FOREIGN KEY (`tbl_id`)
        REFERENCES `staging`.`TABLE_SUPPORT` (`tbl_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `fk_tbl_assign_hackathon_id_idx` FOREIGN KEY (`hackathon_id`)
        REFERENCES `staging`.`HACKATHONS` (`hackathon_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `fk_tbl_assign_proj_id_idx` FOREIGN KEY (`proj_id`)
        REFERENCES `staging`.`PROJECT_LIST` (`proj_id`)
        ON UPDATE CASCADE ON DELETE RESTRICT
)  ENGINE=INNODB DEFAULT CHARACTER SET=LATIN1;
-- -----------------------------------------------------
-- Placeholder table for view `staging`.`ATTENDANCE`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`ATTENDANCE` (
    `scan_id` INT,
    `scan_time` INT,
    `user_id` INT,
    `event_id` INT,
    `event_start_time` INT,
    `event_end_time` INT,
    `event_title` INT,
    `event_description` INT,
    `event_type` INT,
    `hackathon_id` INT,
    `hackathon_name` INT,
    `hackathon_start_time` INT,
    `hackathon_end_time` INT,
    `hackathon_base_pin` INT,
    `hackathon_active` INT
);
-- -----------------------------------------------------
-- Placeholder table for view `staging`.`ATTENDANCE_LEGACY`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staging`.`ATTENDANCE_LEGACY` (
    `scan_id` INT,
    `scan_location` INT,
    `scan_time` INT,
    `user_id` INT,
    `location_name` INT,
    `event_uid` INT,
    `event_start_time` INT,
    `event_end_time` INT,
    `event_title` INT,
    `event_description` INT,
    `event_type` INT,
    `hackathon_id` INT,
    `hackathon_name` INT,
    `hackathon_start_time` INT,
    `hackathon_end_time` INT,
    `hackathon_base_pin` INT,
    `hackathon_active` INT
);
-- -----------------------------------------------------
-- procedure assign_table
-- -----------------------------------------------------
DELIMITER $$
USE `staging` $$
CREATE DEFINER = `hackpsudev` @`%` PROCEDURE `assign_table`(
    in proj_id_param VARCHAR(45),
    in category_id_param VARCHAR(45),
    out tbl_num_param int(11)
) BEGIN
SET @hackathon_var:= ( SELECT `hackathon_id` FROM `HACKATHONS` WHERE `active` = 1 );
SET tbl_num_param:= ( SELECT `table_id` FROM `TABLE_SUPPORT` WHERE `category_id` = `category_id_param` AND `hackathon_id` = `@hackathon_var` AND `tbl_id` NOT IN (
        SELECT `tbl_num` FROM `TABLE_ASSIGNMENTS` `tbl_assignment` WHERE `hackathon` = @hackathon_var FOR UPDATE
    ) ORDER BY `tbl_assignment`.`priority` DESC LIMIT 1 LOCK IN SHARE MODE
  );
IF tbl_num_param IS NOT NULL THEN
    INSERT INTO `TABLE_ASSIGNMENTS` ( `tbl_assign_id`, `tbl_num`, `proj_id`, `hackathon_id` ) VALUES ( UUID(), tbl_num_param, `proj_id_param`, @hackathon_var );
END IF;
END$$
DELIMITER ;
-- -----------------------------------------------------
-- procedure assign_team
-- -----------------------------------------------------
DELIMITER $$
USE `staging` $$
CREATE DEFINER = `hackpsudev` @`%` PROCEDURE `assign_team`(IN proj_name_param VARCHAR(50),IN team_ids_param LONGTEXT,IN proj_cat_param LONGTEXT,IN proj_desc_param LONGTEXT,OUT proj_id_param varchar(45)) proc_lbl :begin
SET @hackathon_var:= (SELECT `hackathon_id` FROM `HACKATHONS` WHERE `active` = 1);
SET @pos:= 1;
-- Find first comma to run csv separation
SET @len:= LOCATE(',', team_ids_param) - @pos;
-- No commas found: only one id provided
IF @len = -1 THEN
    SET @len:= CHAR_LENGTH(team_ids_param);
END IF;
-- Separate all comma separated ids
SET @num:= 0;
-- Check for duplicates in a loop
teamLoop: WHILE TRUE DO
    SET @team_member:= SUBSTRING(team_ids_param, @pos, @len);
    -- Check how many times this user id showed up
    SET @num:= ( SELECT COUNT(*) FROM `PROJECT_TEAMS` WHERE `user_id` = @team_member AND `hackathon_id` = @hackathon_var LOCK IN SHARE MODE);
    -- throw error for duplicates
    IF @num > 0 THEN SIGNAL SQLSTATE '45000'
        SET message_text = 'duplicate user detected';
        leave proc_lbl;
    END IF;
    SET @pos:= @pos + @len + 1;
    SET @n:= LOCATE(',', team_ids_param, @pos);
    -- If no more commas, check duplicate (hack for last id)
    IF @n = 0 THEN
        SET @teamMember:= SUBSTRING(team_ids_param, @pos, @len);
        SET @num:= ( SELECT COUNT(*) FROM `PROJECT_TEAMS` WHERE `user_id` = @team_member AND `hackathon_id` = @hackathon_var LOCK IN SHARE MODE);
    -- throw error for duplicates
        IF @num > 0 THEN SIGNAL SQLSTATE '45000'
            SET message_text = 'duplicate user detected';
            leave proc_lbl;
        END IF;
        leave teamLoop;
    END IF;
    SET @len:= @n - @pos;
END WHILE;
SET proj_id_param:= UUID();
INSERT INTO `PROJECT_LIST` (`proj_id`, `name`, `description`, `hackathon_id`) VALUES ( `proj_id_param`, `proj_name_param`, `proj_desc_param`, @hackathon_var );
-- Add all team members
SET @pos:= 1;
SET @len:= LOCATE(',', team_ids_param) - @pos;
-- Only one team member found
IF @len = -1 THEN
    SET @len:= CHAR_LENGTH(team_ids_param);
END IF;
SET @num:= 0;
-- Insert all team members
insertLoop: WHILE TRUE DO
    SET @team_member:= SUBSTRING(team_ids_param, @pos, @len);
    INSERT INTO `PROJECT_TEAMS` ( `proj_team_id`, `user_id`, `project_id`, `hackathon_id` ) VALUES ( UUID(), @team_member, proj_id_param, @hackathon_var);
    SET @pos:= @pos + @len + 1;
    SET @n:= LOCATE(',', team_ids_param, @pos);
-- No more commas (hack for last id)
    IF @n = 0 THEN
        SET @team_member:= SUBSTRING(team_ids_param, @pos, @len);
        INSERT INTO `PROJECT_TEAMS` ( `proj_team_id`, `user_id`, `project_id`, `hackathon_id` ) VALUES ( UUID(), @team_member, proj_id_param, @hackathon_var );
    leave insertLoop;
    END IF;
SET @len:= @n - @pos;
END WHILE;
-- Parse out project categories
SET @pos:= 1;
SET @len:= LOCATE(',', proj_cat_param) - @pos;
IF @len = -1 THEN
    SET @len:= CHAR_LENGTH(proj_cat_param);
END IF;
SET @num:= 0;
-- Insert categories for project
catLoop: WHILE TRUE DO
    SET @cat:= SUBSTRING(proj_cat_param, @pos, @len);
    INSERT INTO `PROJECT_CATEGORIES` (`proj_cat_id`, `proj_id`, `cat_id`) VALUES ( UUID(), proj_id_param, @cat );
    SET @pos:= @pos + @len + 1;
    SET @n:= LOCATE(',', proj_cat_param, @pos);
    -- Last category (hack for last id)
    IF @n = 0 THEN
        SET @cat:= SUBSTRING(proj_cat_param, @pos, @len);
        INSERT INTO `PROJECT_CATEGORIES` (`proj_cat_id`, `proj_id`, `cat_id`) VALUES ( UUID(), proj_id_param, @cat );
        leave catLoop;
    END IF;
    SET @len:= @n - @pos;
END WHILE;
end$$
DELIMITER ;
-- -----------------------------------------------------
-- View `staging`.`ATTENDANCE`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `staging`.`ATTENDANCE`;
USE `staging`;
CREATE OR REPLACE
    ALGORITHM = UNDEFINED
    DEFINER = `hackpsudev`@`%`
    SQL SECURITY DEFINER
VIEW `staging`.`ATTENDANCE` AS
    SELECT
        `staging`.`SCANS`.`scan_id` AS `scan_id`,
        `staging`.`SCANS`.`time` AS `scan_time`,
        `staging`.`RFID_ASSIGNMENTS`.`user_id` AS `user_id`,
        `staging`.`EVENTS`.`event_id` AS `event_id`,
        `staging`.`EVENTS`.`start_time` AS `event_start_time`,
        `staging`.`EVENTS`.`end_time` AS `event_end_time`,
        `staging`.`EVENTS`.`title` AS `event_title`,
        `staging`.`EVENTS`.`description` AS `event_description`,
        `staging`.`EVENTS`.`type` AS `event_type`,
        `staging`.`HACKATHONS`.`hackathon_id` AS `hackathon_id`,
        `staging`.`HACKATHONS`.`name` AS `hackathon_name`,
        `staging`.`HACKATHONS`.`start_time` AS `hackathon_start_time`,
        `staging`.`HACKATHONS`.`end_time` AS `hackathon_end_time`,
        `staging`.`HACKATHONS`.`base_pin` AS `hackathon_base_pin`,
        `staging`.`HACKATHONS`.`active` AS `hackathon_active`
    FROM
        (((`staging`.`RFID_ASSIGNMENTS`
        JOIN `staging`.`SCANS` ON ((`staging`.`RFID_ASSIGNMENTS`.`rfid_id` = `staging`.`SCANS`.`rfid_id`)))
        JOIN `staging`.`EVENTS` ON ((`staging`.`SCANS`.`event_id` = `staging`.`EVENTS`.`event_id`)))
        JOIN `staging`.`HACKATHONS` ON ((`staging`.`RFID_ASSIGNMENTS`.`hackathon_id` = `staging`.`HACKATHONS`.`hackathon_id`)))
    ORDER BY `staging`.`SCANS`.`time`;
-- -----------------------------------------------------
  -- View `staging`.`ATTENDANCE_LEGACY`
  -- -----------------------------------------------------
  DROP TABLE IF EXISTS `staging`.`ATTENDANCE_LEGACY`;
USE `staging`;
CREATE OR REPLACE
    ALGORITHM = UNDEFINED
    DEFINER = `hackpsudev`@`%`
    SQL SECURITY DEFINER
VIEW `staging`.`ATTENDANCE_LEGACY` AS
    SELECT
        `staging`.`SCANS`.`scan_id` AS `scan_id`,
        `staging`.`SCANS`.`location_id` AS `scan_location`,
        `staging`.`SCANS`.`time` AS `scan_time`,
        `staging`.`RFID_ASSIGNMENTS`.`user_id` AS `user_id`,
        `staging`.`LOCATIONS`.`name` AS `location_name`,
        `staging`.`EVENTS`.`event_id` AS `event_id`,
        `staging`.`EVENTS`.`start_time` AS `event_start_time`,
        `staging`.`EVENTS`.`end_time` AS `event_end_time`,
        `staging`.`EVENTS`.`title` AS `event_title`,
        `staging`.`EVENTS`.`description` AS `event_description`,
        `staging`.`EVENTS`.`type` AS `event_type`,
        `staging`.`HACKATHONS`.`hackathon_id` AS `hackathon_id`,
        `staging`.`HACKATHONS`.`name` AS `hackathon_name`,
        `staging`.`HACKATHONS`.`start_time` AS `hackathon_start_time`,
        `staging`.`HACKATHONS`.`end_time` AS `hackathon_end_time`,
        `staging`.`HACKATHONS`.`base_pin` AS `hackathon_base_pin`,
        `staging`.`HACKATHONS`.`active` AS `hackathon_active`
    FROM
        ((((`staging`.`RFID_ASSIGNMENTS`
        JOIN `staging`.`SCANS` ON ((`staging`.`RFID_ASSIGNMENTS`.`rfid_id` = `staging`.`SCANS`.`rfid_id`)))
        JOIN `staging`.`LOCATIONS` ON ((`staging`.`SCANS`.`location_id` = `staging`.`LOCATIONS`.`location_id`)))
        JOIN `staging`.`EVENTS` ON (((`staging`.`LOCATIONS`.`location_id` = `staging`.`EVENTS`.`location_id`)
            AND (`staging`.`SCANS`.`time` BETWEEN (`staging`.`EVENTS`.`start_time`) AND `staging`.`EVENTS`.`end_time`)
            AND (`staging`.`EVENTS`.`type` IN ('workshop' , 'food')))))
        JOIN `staging`.`HACKATHONS` ON ((`staging`.`RFID_ASSIGNMENTS`.`hackathon_id` = `staging`.`HACKATHONS`.`hackathon_id`)))
    ORDER BY `staging`.`SCANS`.`time`;
SET
  SQL_MODE = @OLD_SQL_MODE;
SET
  FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
SET
  UNIQUE_CHECKS = @OLD_UNIQUE_CHECKS;
