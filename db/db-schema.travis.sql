-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema travis
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `travis` ;

-- -----------------------------------------------------
-- Schema travis
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `travis` DEFAULT CHARACTER SET utf8 ;
USE `travis` ;

-- -----------------------------------------------------
-- Table `travis`.`HACKATHON`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`HACKATHON` (
  `uid` VARCHAR(45) NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `start_time` VARCHAR(45) NOT NULL,
  `end_time` VARCHAR(45) NULL DEFAULT NULL,
  `base_pin` INT(11) NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`uid`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`BUDGET_ITEM`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`BUDGET_ITEM` (
  `uid` VARCHAR(45) NOT NULL,
  `team` ENUM('communication', 'design', 'education', 'entertainment', 'finance', 'logistics', 'marketing', 'sponsorship', 'technology') NOT NULL,
  `item_name` LONGTEXT NOT NULL,
  `price` FLOAT NOT NULL,
  `quantity` INT(10) UNSIGNED NOT NULL,
  `vendor` LONGTEXT NOT NULL,
  `hackathon` VARCHAR(45) NOT NULL,
  `accepted` TINYINT(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`uid`),
  INDEX `fk_budget_item_hackathon_id_idx` (`hackathon` ASC),
  INDEX `idx_team` (`team` ASC),
  CONSTRAINT `fk_budget_item_hackathon_id`
    FOREIGN KEY (`hackathon`)
    REFERENCES `travis`.`HACKATHON` (`uid`)
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`CATEGORY_LIST`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`CATEGORY_LIST` (
  `uid` INT(11) NOT NULL DEFAULT '0',
  `categoryName` VARCHAR(100) NULL DEFAULT NULL,
  `isSponsor` TINYINT(1) NULL DEFAULT NULL,
  PRIMARY KEY (`uid`),
  UNIQUE INDEX `categoryID` (`uid` ASC),
  UNIQUE INDEX `categoryName` (`categoryName` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`CHECKOUT_ITEMS`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`CHECKOUT_ITEMS` (
  `uid` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL,
  `quantity` INT(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`uid`))
ENGINE = InnoDB
AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`REGISTRATION`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`REGISTRATION` (
  `uid` CHAR(36) NOT NULL,
  `firstname` VARCHAR(45) NOT NULL,
  `lastname` VARCHAR(45) NOT NULL,
  `gender` ENUM('male', 'female', 'non-binary', 'no-disclose') NOT NULL,
  `eighteenBeforeEvent` TINYINT(4) NOT NULL DEFAULT '1',
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
  `mlh_coc` TINYINT(4) NOT NULL DEFAULT '1',
  `mlh_dcp` TINYINT(4) NOT NULL DEFAULT '1',
  `phone` VARCHAR(50) NOT NULL,
  `race` VARCHAR(150) NULL DEFAULT NULL,
  `coding_experience` ENUM('none', 'beginner', 'intermediate', 'advanced', 'god') NULL DEFAULT 'none',
  `referral` TEXT NULL DEFAULT NULL,
  `project` LONGTEXT NULL DEFAULT NULL,
  `submitted` TINYINT(4) NOT NULL DEFAULT '0',
  `expectations` LONGTEXT NULL DEFAULT NULL,
  `veteran` VARCHAR(15) NULL DEFAULT 'false',
  `pin` INT(11) NOT NULL AUTO_INCREMENT,
  `time` VARCHAR(45) NULL DEFAULT NULL,
  `hackathon` VARCHAR(45) NOT NULL DEFAULT '84ed52ff52f84591aabe151666fae240',
  PRIMARY KEY (`uid`, `hackathon`),
  UNIQUE INDEX `pin_UNIQUE` (`pin` ASC),
  INDEX `hackathon_fkey_idx` (`hackathon` ASC),
  CONSTRAINT `reg_hackathon_fkey`
    FOREIGN KEY (`hackathon`)
    REFERENCES `travis`.`HACKATHON` (`uid`)
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 7785
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`CHECKOUT_DATA`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`CHECKOUT_DATA` (
  `uid` INT(11) NOT NULL AUTO_INCREMENT,
  `item_id` INT(11) NOT NULL,
  `user_id` CHAR(36) NULL DEFAULT NULL,
  `checkout_time` VARCHAR(45) NOT NULL,
  `return_time` VARCHAR(45) NULL DEFAULT NULL,
  `hackathon` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`uid`),
  INDEX `checkout_item_id_fk_idx` (`item_id` ASC),
  INDEX `user_id_fk_idx` (`user_id` ASC),
  INDEX `checkout_hackathon_id_fk_idx` (`hackathon` ASC),
  CONSTRAINT `checkout_hackathon_id_fk`
    FOREIGN KEY (`hackathon`)
    REFERENCES `travis`.`HACKATHON` (`uid`)
    ON UPDATE CASCADE,
  CONSTRAINT `checkout_item_id_fk`
    FOREIGN KEY (`item_id`)
    REFERENCES `travis`.`CHECKOUT_ITEMS` (`uid`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `checkout_user_id_fk`
    FOREIGN KEY (`user_id`)
    REFERENCES `travis`.`REGISTRATION` (`uid`)
    ON DELETE NO ACTION
    ON UPDATE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 81
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`EMAIL_HISTORY`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`EMAIL_HISTORY` (
  `idEMAIL_HISTORY` INT(11) NOT NULL AUTO_INCREMENT,
  `sender` VARCHAR(36) NOT NULL,
  `recipient` VARCHAR(255) NOT NULL,
  `email_content` LONGTEXT NOT NULL,
  `subject` VARCHAR(500) NULL DEFAULT NULL,
  `recipient_name` VARCHAR(90) NOT NULL,
  `status` ENUM('200', '207') NOT NULL,
  `time` VARCHAR(45) NULL DEFAULT NULL,
  PRIMARY KEY (`idEMAIL_HISTORY`))
ENGINE = InnoDB
AUTO_INCREMENT = 878
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`LOCATIONS`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`LOCATIONS` (
  `uid` INT(11) NOT NULL AUTO_INCREMENT,
  `location_name` VARCHAR(200) NULL DEFAULT NULL,
  PRIMARY KEY (`uid`))
ENGINE = InnoDB
AUTO_INCREMENT = 18
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`EVENTS`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`EVENTS` (
  `uid` VARCHAR(45) NOT NULL,
  `event_location` INT(11) NOT NULL,
  `event_start_time` VARCHAR(45) NOT NULL,
  `event_end_time` VARCHAR(45) NOT NULL,
  `event_title` VARCHAR(400) NOT NULL,
  `event_description` LONGTEXT NULL DEFAULT NULL,
  `event_type` ENUM('food', 'workshop', 'activity') NOT NULL DEFAULT 'activity',
  `hackathon` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`uid`),
  INDEX `fk_location_idx` (`event_location` ASC),
  INDEX `events_hackathon_id_fk_idx` (`hackathon` ASC),
  CONSTRAINT `events_hackathon_id_fk`
    FOREIGN KEY (`hackathon`)
    REFERENCES `travis`.`HACKATHON` (`uid`)
    ON UPDATE CASCADE,
  CONSTRAINT `fk_location`
    FOREIGN KEY (`event_location`)
    REFERENCES `travis`.`LOCATIONS` (`uid`)
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`EXTRA_CREDIT_CLASSES`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`EXTRA_CREDIT_CLASSES` (
  `uid` INT(11) NOT NULL AUTO_INCREMENT,
  `class_name` VARCHAR(90) NOT NULL,
  PRIMARY KEY (`uid`))
ENGINE = InnoDB
AUTO_INCREMENT = 17
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`EXTRA_CREDIT_ASSIGNMENT`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`EXTRA_CREDIT_ASSIGNMENT` (
  `uid` INT(11) NOT NULL AUTO_INCREMENT,
  `user_uid` CHAR(36) NOT NULL,
  `class_uid` INT(11) NOT NULL,
  `hackathon` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`uid`),
  UNIQUE INDEX `uniq_user_class_hackathon` (`user_uid` ASC, `class_uid` ASC, `hackathon` ASC),
  INDEX `fk_ec_user_idx` (`user_uid` ASC),
  INDEX `fk_ec_class_idx` (`class_uid` ASC),
  INDEX `fk_ec_hackathon_idx` (`hackathon` ASC),
  CONSTRAINT `fk_ec_class`
    FOREIGN KEY (`class_uid`)
    REFERENCES `travis`.`EXTRA_CREDIT_CLASSES` (`uid`)
    ON UPDATE CASCADE,
  CONSTRAINT `fk_ec_hackathon`
    FOREIGN KEY (`hackathon`)
    REFERENCES `travis`.`HACKATHON` (`uid`)
    ON UPDATE CASCADE,
  CONSTRAINT `fk_ec_user`
    FOREIGN KEY (`user_uid`)
    REFERENCES `travis`.`REGISTRATION` (`uid`)
    ON UPDATE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 2376
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`LIVE_UPDATES`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`LIVE_UPDATES` (
  `uid` VARCHAR(45) NOT NULL,
  `update_text` LONGTEXT NOT NULL,
  `update_image` VARCHAR(500) NULL DEFAULT NULL,
  `update_title` TINYTEXT NOT NULL,
  `hackathon` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`uid`),
  UNIQUE INDEX `idLIVE_UPDATES_UNIQUE` (`uid` ASC),
  INDEX `fk_live_update_hackathon_idx` (`hackathon` ASC),
  FULLTEXT INDEX `searchable` (`update_text`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`PI_TEST`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`PI_TEST` (
  `idPI_TEST` INT(11) NOT NULL AUTO_INCREMENT,
  `time` INT(11) NULL DEFAULT NULL,
  `message` VARCHAR(45) NULL DEFAULT NULL,
  PRIMARY KEY (`idPI_TEST`))
ENGINE = InnoDB
AUTO_INCREMENT = 25
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`PRE_REGISTRATION`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`PRE_REGISTRATION` (
  `uid` CHAR(36) NOT NULL DEFAULT '',
  `email` VARCHAR(255) CHARACTER SET 'utf8' NOT NULL,
  `hackathon` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`uid`),
  UNIQUE INDEX `id_UNIQUE` (`uid` ASC),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC),
  INDEX `pre_reg_hackathon_id_fk_idx` (`hackathon` ASC),
  CONSTRAINT `pre_reg_hackathon_id_fk`
    FOREIGN KEY (`hackathon`)
    REFERENCES `travis`.`HACKATHON` (`uid`)
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`PROJECT_LIST`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`PROJECT_LIST` (
  `projectID` CHAR(36) NOT NULL,
  `projectName` VARCHAR(50) NULL DEFAULT NULL,
  `hackathon` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`projectID`),
  INDEX `project_list_hackathon_fk_idx` (`hackathon` ASC),
  CONSTRAINT `project_list_hackathon_fk`
    FOREIGN KEY (`hackathon`)
    REFERENCES `travis`.`HACKATHON` (`uid`)
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`PROJECT_CATEGORIES`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`PROJECT_CATEGORIES` (
  `projectID` CHAR(36) NOT NULL,
  `categoryID` INT(11) NOT NULL,
  PRIMARY KEY (`projectID`, `categoryID`),
  INDEX `CATEGORY_LIST_ibfk_2_idx` (`categoryID` ASC),
  INDEX `CATEGORY_LIST_ibfk_3_idx` (`categoryID` ASC),
  CONSTRAINT `CATEGORY_LIST_ibfk_3`
    FOREIGN KEY (`categoryID`)
    REFERENCES `travis`.`CATEGORY_LIST` (`uid`),
  CONSTRAINT `PROJECT_CATEGORIES_ibfk_1`
    FOREIGN KEY (`projectID`)
    REFERENCES `travis`.`PROJECT_LIST` (`projectID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`PROJECT_TEAM`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`PROJECT_TEAM` (
  `userID` CHAR(36) NOT NULL,
  `projectID` CHAR(36) NOT NULL,
  PRIMARY KEY (`userID`, `projectID`),
  UNIQUE INDEX `userID` (`userID` ASC),
  INDEX `PROJECT_TEAM_ibfk_2` (`projectID` ASC),
  CONSTRAINT `PROJECT_TEAM_ibfk_1`
    FOREIGN KEY (`userID`)
    REFERENCES `travis`.`REGISTRATION` (`uid`),
  CONSTRAINT `PROJECT_TEAM_ibfk_2`
    FOREIGN KEY (`projectID`)
    REFERENCES `travis`.`PROJECT_LIST` (`projectID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`RECEIPT`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`RECEIPT` (
  `uid` VARCHAR(45) NOT NULL,
  `url` LONGTEXT NOT NULL,
  `time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`uid`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`REIMBURSEMENT`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`REIMBURSEMENT` (
  `uid` VARCHAR(45) NOT NULL,
  `type` ENUM('PURCHASE_ORDER', 'REIMBURSEMENT') NOT NULL,
  `item_uid` VARCHAR(45) NOT NULL,
  `user_uid` VARCHAR(45) NOT NULL,
  `cost` FLOAT NOT NULL,
  `receipt_uid` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`uid`),
  INDEX `fk_reimbursement_item_id_idx` (`item_uid` ASC),
  INDEX `fk_reimbursement_receipt_id_idx` (`receipt_uid` ASC),
  CONSTRAINT `fk_reimbursement_item_id`
    FOREIGN KEY (`item_uid`)
    REFERENCES `travis`.`BUDGET_ITEM` (`uid`)
    ON UPDATE CASCADE,
  CONSTRAINT `fk_reimbursement_receipt_id`
    FOREIGN KEY (`receipt_uid`)
    REFERENCES `travis`.`RECEIPT` (`uid`)
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`REQ_DATA`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`REQ_DATA` (
  `idREQ_DATA` VARCHAR(36) NOT NULL,
  `req_time` VARCHAR(45) NOT NULL,
  `req_ip` VARCHAR(45) NOT NULL,
  `req_user_agent` VARCHAR(150) NULL DEFAULT NULL,
  PRIMARY KEY (`idREQ_DATA`),
  UNIQUE INDEX `idREQ_DATA_UNIQUE` (`idREQ_DATA` ASC),
  FULLTEXT INDEX `user_agent_search` (`req_user_agent`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`RFID_ASSIGNMENTS`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`RFID_ASSIGNMENTS` (
  `rfid_uid` VARCHAR(70) NOT NULL,
  `user_uid` CHAR(36) NOT NULL,
  `time` VARCHAR(45) NULL DEFAULT NULL,
  `hackathon` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`rfid_uid`, `user_uid`),
  UNIQUE INDEX `rfid_uid_UNIQUE` (`rfid_uid` ASC),
  INDEX `rfid_assignment_hackathon_fk_idx` (`hackathon` ASC),
  INDEX `rfid_assignment_user_uid_fkey_idx` (`user_uid` ASC),
  CONSTRAINT `rfid_assignment_hackathon_fk`
    FOREIGN KEY (`hackathon`)
    REFERENCES `travis`.`HACKATHON` (`uid`)
    ON UPDATE CASCADE,
  CONSTRAINT `rfid_assignment_user_uid_fkey`
    FOREIGN KEY (`user_uid`)
    REFERENCES `travis`.`REGISTRATION` (`uid`)
    ON DELETE NO ACTION
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`RSVP`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`RSVP` (
  `user_id` CHAR(36) NOT NULL,
  `rsvp_time` VARCHAR(45) NOT NULL,
  `rsvp_status` TINYINT(4) NOT NULL DEFAULT '0',
  `hackathon` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`user_id`, `hackathon`),
  INDEX `rsvp_hackathon_id_fk_idx` (`hackathon` ASC),
  CONSTRAINT `rsvp_hackathon_id_fk`
    FOREIGN KEY (`hackathon`)
    REFERENCES `travis`.`HACKATHON` (`uid`)
    ON UPDATE CASCADE,
  CONSTRAINT `user_id_fk`
    FOREIGN KEY (`user_id`)
    REFERENCES `travis`.`REGISTRATION` (`uid`)
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`SCANS`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`SCANS` (
  `idSCANS` INT(11) NOT NULL AUTO_INCREMENT,
  `rfid_uid` VARCHAR(70) NOT NULL,
  `scan_location` INT(11) NULL DEFAULT NULL,
  `scan_time` VARCHAR(45) NOT NULL,
  `hackathon` VARCHAR(45) NOT NULL,
  `scan_event` VARCHAR(45) NULL DEFAULT NULL,
  PRIMARY KEY (`idSCANS`),
  INDEX `rfid_uid_fk_idx` (`rfid_uid` ASC),
  INDEX `fk_location_idx` (`scan_location` ASC),
  INDEX `fk_location_scans` (`scan_location` ASC),
  INDEX `scans_hackathon_fk_idx` (`hackathon` ASC),
  INDEX `scans_event_fk_idx` (`scan_event` ASC),
  CONSTRAINT `fk_location_scan`
    FOREIGN KEY (`scan_location`)
    REFERENCES `travis`.`LOCATIONS` (`uid`)
    ON UPDATE CASCADE,
  CONSTRAINT `rfid_uid_fk`
    FOREIGN KEY (`rfid_uid`)
    REFERENCES `travis`.`RFID_ASSIGNMENTS` (`rfid_uid`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `scans_event_fk`
    FOREIGN KEY (`scan_event`)
    REFERENCES `travis`.`EVENTS` (`uid`)
    ON UPDATE CASCADE,
  CONSTRAINT `scans_hackathon_fk`
    FOREIGN KEY (`hackathon`)
    REFERENCES `travis`.`HACKATHON` (`uid`)
    ON UPDATE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 5487
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`TABLE_SUPPORT`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`TABLE_SUPPORT` (
  `tableID` INT(11) NOT NULL,
  `categoryID` INT(11) NOT NULL,
  `priority` TINYINT(1) NULL DEFAULT NULL,
  `hackathon` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`tableID`, `categoryID`, `hackathon`),
  INDEX `TABLE_SUPPORT_ibfk_2` (`categoryID` ASC),
  INDEX `table_support_hackathon_fk_idx` (`hackathon` ASC),
  CONSTRAINT `TABLE_SUPPORT_ibfk_2`
    FOREIGN KEY (`categoryID`)
    REFERENCES `travis`.`CATEGORY_LIST` (`uid`),
  CONSTRAINT `table_support_hackathon_fk`
    FOREIGN KEY (`hackathon`)
    REFERENCES `travis`.`HACKATHON` (`uid`)
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`TABLE_ASSIGNMENTS`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`TABLE_ASSIGNMENTS` (
  `tableNumber` INT(11) NOT NULL,
  `projectID` CHAR(36) NOT NULL,
  `hackathon` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`tableNumber`),
  INDEX `table_assignment_hackathon_fk_idx` (`hackathon` ASC),
  CONSTRAINT `TABLE_ASSIGNMENTS_ibfk_2`
    FOREIGN KEY (`tableNumber`)
    REFERENCES `travis`.`TABLE_SUPPORT` (`tableID`)
    ON UPDATE CASCADE,
  CONSTRAINT `table_assignment_hackathon_fk`
    FOREIGN KEY (`hackathon`)
    REFERENCES `travis`.`HACKATHON` (`uid`)
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `travis`.`TRAVEL_REIMBURSEMENT`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`TRAVEL_REIMBURSEMENT` (
  `uid` VARCHAR(45) NOT NULL,
  `fullname` VARCHAR(90) NOT NULL,
  `reimbursement_amount` INT(11) NOT NULL,
  `mailing_address` VARCHAR(256) NOT NULL,
  `group_members` ENUM('1', '2', '3', '4+') NOT NULL DEFAULT '1',
  `receipt_uris` LONGTEXT NULL DEFAULT NULL,
  `user_id` CHAR(36) NOT NULL,
  `hackathon` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`uid`),
  UNIQUE INDEX `uid_UNIQUE` (`uid` ASC),
  INDEX `fk_user_id_idx` (`user_id` ASC),
  INDEX `travel_reimb_hackathon_fk_idx` (`hackathon` ASC),
  CONSTRAINT `fk_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `travis`.`REGISTRATION` (`uid`)
    ON UPDATE CASCADE,
  CONSTRAINT `travel_reimb_hackathon_fk`
    FOREIGN KEY (`hackathon`)
    REFERENCES `travis`.`HACKATHON` (`uid`)
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;

USE `travis` ;

-- -----------------------------------------------------
-- Placeholder table for view `travis`.`ATTENDANCE`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`ATTENDANCE` (`idSCANS` INT, `scan_time` INT, `user_uid` INT, `event_uid` INT, `event_start_time` INT, `event_end_time` INT, `event_title` INT, `event_description` INT, `event_type` INT, `hackathon_id` INT, `hackathon_name` INT, `hackathon_start_time` INT, `hackathon_end_time` INT, `hackathon_base_pin` INT, `hackathon_active` INT);

-- -----------------------------------------------------
-- Placeholder table for view `travis`.`ATTENDANCE_LEGACY`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `travis`.`ATTENDANCE_LEGACY` (`idSCANS` INT, `scan_location` INT, `scan_time` INT, `user_uid` INT, `location_name` INT, `event_uid` INT, `event_start_time` INT, `event_end_time` INT, `event_title` INT, `event_description` INT, `event_type` INT, `hackathon_id` INT, `hackathon_name` INT, `hackathon_start_time` INT, `hackathon_end_time` INT, `hackathon_base_pin` INT, `hackathon_active` INT);

-- -----------------------------------------------------
-- procedure assignTable
-- -----------------------------------------------------

DELIMITER $$
USE `travis`$$
CREATE DEFINER=`hackpsudev`@`%` PROCEDURE `assignTable`(in projectID_param char(36), in categoryID_param int(11), out tableNumber_param int(11))
begin
	
	set @hackathon_var := (select `uid` from `HACKATHON` where `active` = 1);
	
    set tableNumber_param := 
        (select tableID from TABLE_SUPPORT 
            where categoryID = categoryID_param and hackathon = @hackathon_var and tableID not in (select tableNumber from TABLE_ASSIGNMENTS where hackathon = @hackathon_var)
                order by priority desc limit 1 for update);
	
    if tableNumber_param is not null then
		
        insert into TABLE_ASSIGNMENTS (tableNumber, projectID, hackathon) values (tableNumber_param, projectID_param, @hackathon_var);
    end if;
	
    update TABLE_SUPPORT set tableID = tableNumber_param where tableID = tableNumber_param and hackathon = @hackathon_var; 
end$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure assignTeam
-- -----------------------------------------------------

DELIMITER $$
USE `travis`$$
CREATE DEFINER=`hackpsudev`@`%` PROCEDURE `assignTeam`(in projectName_param varchar(50), in teamUIDs_param longtext, in projectCategories_param longtext, out projectID_param varchar(45))
proc_lbl:begin
	
	set @hackathon_var := (select `uid` from `HACKATHON` where `active` = 1);
	
	
    set @pos := 1;
    set @len := locate(',', teamUIDs_param) - @pos;
    if @len = -1 then
		set @len := char_length(teamUIDs_param);
    end if;
    set @num := 0;
	
	
    teamLoop: while true do
        set @teamMember := substring(teamUIDs_param, @pos, @len);
		
		
        set @num := (select count(*) from PROJECT_TEAM where userID = @teamMember);
        if @num > 0 then
            signal sqlstate '45000' set message_text = 'duplilcate user detected';
            leave proc_lbl;
        end if;
		
		
        set @pos := @pos + @len + 1;
        set @n := locate(',', teamUIDs_param, @pos);
		
		
        if @n = 0 then
            set @teamMember := substring(teamUIDs_param, @pos, @len);
			
			
            set @num := (select count(*) from PROJECT_TEAM where userID = @teamMember);
            if @num > 0 then
                signal sqlstate '45000' set message_text = 'duplilcate user detected';
                leave proc_lbl;
            end if;
			
			
            leave teamLoop;
        end if;
		
		
        set @len := @n - @pos;
    end while;

	
    set projectID_param := uuid();
    insert into PROJECT_LIST (projectID, projectName, hackathon) values (projectID_param, projectName_param, @hackathon_var);
    
	
    set @pos := 1;
    set @len := locate(',', teamUIDs_param) - @pos;
    
    if @len = -1 then
		set @len := char_length(teamUIDs_param);
    end if;
    set @num := 0;
	
	
    insertLoop: while true do
        set @teamMember := substring(teamUIDs_param, @pos, @len);
		
        insert into PROJECT_TEAM (userID, projectID) values (@teamMember, projectID_param);
        set @pos := @pos + @len + 1;
        set @n := locate(',', teamUIDs_param, @pos);
		
		
        if @n = 0 then
            set @teamMember := substring(teamUIDs_param, @pos, @len);
            set @num := (select count(*) from PROJECT_TEAM where userID = @teamMember);
            insert into PROJECT_TEAM (userID, projectID) values (@teamMember, projectID_param);
            
			
			leave insertLoop;
        end if;
        set @len := @n - @pos;
    end while;
    
	
    set @pos := 1;
    set @len := locate(',', projectCategories_param) - @pos;
	
    if @len = -1 then
		set @len := char_length(projectCategories_param);
    end if;
    set @num := 0;
	
	
    catLoop: while true do
        set @cat := substring(projectCategories_param, @pos, @len);
        set @catNum := cast(@cat as unsigned);
        
		
		insert into PROJECT_CATEGORIES (projectID, categoryID) values (projectID_param, @catNum);
        set @pos := @pos + @len + 1;
        set @n := locate(',', projectCategories_param, @pos);
		
		
        if @n = 0 then
            set @cat := substring(projectCategories_param, @pos, @len);
            set @catNum := cast(@cat as unsigned);
            if @catNum <> 0 then
                insert into PROJECT_CATEGORIES (projectID, categoryID) values (projectID_param, @catNum);
            end if;
			
			
            leave catLoop;
        end if;
        set @len := @n - @pos;
    end while;
    
end$$

DELIMITER ;

-- -----------------------------------------------------
-- View `travis`.`ATTENDANCE`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `travis`.`ATTENDANCE`;
USE `travis`;
CREATE  OR REPLACE ALGORITHM=UNDEFINED DEFINER=`hackpsudev`@`%` SQL SECURITY DEFINER VIEW `travis`.`ATTENDANCE` AS select `travis`.`SCANS`.`idSCANS` AS `idSCANS`,`travis`.`SCANS`.`scan_time` AS `scan_time`,`travis`.`RFID_ASSIGNMENTS`.`user_uid` AS `user_uid`,`travis`.`EVENTS`.`uid` AS `event_uid`,`travis`.`EVENTS`.`event_start_time` AS `event_start_time`,`travis`.`EVENTS`.`event_end_time` AS `event_end_time`,`travis`.`EVENTS`.`event_title` AS `event_title`,`travis`.`EVENTS`.`event_description` AS `event_description`,`travis`.`EVENTS`.`event_type` AS `event_type`,`travis`.`HACKATHON`.`uid` AS `hackathon_id`,`travis`.`HACKATHON`.`name` AS `hackathon_name`,`travis`.`HACKATHON`.`start_time` AS `hackathon_start_time`,`travis`.`HACKATHON`.`end_time` AS `hackathon_end_time`,`travis`.`HACKATHON`.`base_pin` AS `hackathon_base_pin`,`travis`.`HACKATHON`.`active` AS `hackathon_active` from (((`travis`.`RFID_ASSIGNMENTS` join `travis`.`SCANS` on((`travis`.`RFID_ASSIGNMENTS`.`rfid_uid` = `travis`.`SCANS`.`rfid_uid`))) join `travis`.`EVENTS` on((`travis`.`SCANS`.`scan_event` = `travis`.`EVENTS`.`uid`))) join `travis`.`HACKATHON` on((`travis`.`RFID_ASSIGNMENTS`.`hackathon` = `travis`.`HACKATHON`.`uid`))) order by `travis`.`SCANS`.`scan_time`;

-- -----------------------------------------------------
-- View `travis`.`ATTENDANCE_LEGACY`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `travis`.`ATTENDANCE_LEGACY`;
USE `travis`;
CREATE  OR REPLACE ALGORITHM=UNDEFINED DEFINER=`hackpsudev`@`%` SQL SECURITY DEFINER VIEW `travis`.`ATTENDANCE_LEGACY` AS select `travis`.`SCANS`.`idSCANS` AS `idSCANS`,`travis`.`SCANS`.`scan_location` AS `scan_location`,`travis`.`SCANS`.`scan_time` AS `scan_time`,`travis`.`RFID_ASSIGNMENTS`.`user_uid` AS `user_uid`,`travis`.`LOCATIONS`.`location_name` AS `location_name`,`travis`.`EVENTS`.`uid` AS `event_uid`,`travis`.`EVENTS`.`event_start_time` AS `event_start_time`,`travis`.`EVENTS`.`event_end_time` AS `event_end_time`,`travis`.`EVENTS`.`event_title` AS `event_title`,`travis`.`EVENTS`.`event_description` AS `event_description`,`travis`.`EVENTS`.`event_type` AS `event_type`,`travis`.`HACKATHON`.`uid` AS `hackathon_id`,`travis`.`HACKATHON`.`name` AS `hackathon_name`,`travis`.`HACKATHON`.`start_time` AS `hackathon_start_time`,`travis`.`HACKATHON`.`end_time` AS `hackathon_end_time`,`travis`.`HACKATHON`.`base_pin` AS `hackathon_base_pin`,`travis`.`HACKATHON`.`active` AS `hackathon_active` from ((((`travis`.`RFID_ASSIGNMENTS` join `travis`.`SCANS` on((`travis`.`RFID_ASSIGNMENTS`.`rfid_uid` = `travis`.`SCANS`.`rfid_uid`))) join `travis`.`LOCATIONS` on((`travis`.`SCANS`.`scan_location` = `travis`.`LOCATIONS`.`uid`))) join `travis`.`EVENTS` on(((`travis`.`LOCATIONS`.`uid` = `travis`.`EVENTS`.`event_location`) and (cast(`travis`.`SCANS`.`scan_time` as unsigned) between cast((`travis`.`EVENTS`.`event_start_time` - 900000) as unsigned) and cast((`travis`.`EVENTS`.`event_end_time` - 300000) as unsigned)) and (`travis`.`EVENTS`.`event_type` in ('workshop','food'))))) join `travis`.`HACKATHON` on((`travis`.`RFID_ASSIGNMENTS`.`hackathon` = `travis`.`HACKATHON`.`uid`))) order by `travis`.`SCANS`.`scan_time`;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
