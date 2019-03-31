/* assignTeam procedure
 *
 * Generates an association of a project and team member UIDs local to the active hackathon UID
 * Does not register a table for the project
 * Please run from within a transaction
 *
 * In:
 *  projectName_param (varchar(50)): The name of the project --  MUST BE SANITIZED
 *  teamUIDs_param (longtext): The list of team member UIDs in a comma separated list (ie. "1234,4556")
 *  projectCategories_param (longtext): The list of categories to register this project for in a comma separated list (ie. "1,4,5")
 * Out:
 *  projectID_param (varchar(45)): The uuid given to the project upon full processing
 * Signals:
 *  45000: duplicate user detected; one user may only be in one project
 *
*/
DROP PROCEDURE IF EXISTS `assignTeam`;
DELIMITER $$
CREATE PROCEDURE `assignTeam`(in projectName_param varchar(50), in teamUIDs_param longtext, in projectCategories_param longtext, out projectID_param varchar(45))
proc_lbl:begin
  -- Validate input
  IF LENGTH(TRIM(teamUIDs_param)) = 0 OR teamUIDs_param IS NULL THEN
      signal sqlstate '45000' set message_text = 'Invalid team UIDs';
      leave proc_lbl;
  END IF;

    IF LENGTH(TRIM(projectCategories_param)) = 0 OR projectCategories_param IS NULL THEN
      signal sqlstate '45000' set message_text = 'Invalid project categories';
      leave proc_lbl;
  END IF;

  -- Get the active hackathon UID
  set @hackathon_var := (select `uid` from `HACKATHON` where `active` = 1);

    -- Prep to Loop
    set @loopList := teamUIDs_param;

  -- Process out all team member UIDs and make sure they aren't in another team yet
    teamLoop: LOOP
    -- exit the loop if the list seems empty or was null;
    -- this extra caution is necessary to avoid an endless loop in the proc.
    IF LENGTH(TRIM(@loopList)) = 0 OR @loopList IS NULL THEN
      LEAVE teamLoop;
    END IF;

    -- capture the next value from the list
    SET @nextVar := SUBSTRING_INDEX(@loopList,',',1);

    -- save the length of the captured value; we will need to remove this
    -- many characters + 1 from the beginning of the string
    -- before the next iteration
    SET @nextVarlen := LENGTH(@nextVar);

    -- trim the value of leading and trailing spaces, in case of sloppy CSV strings
    SET @teamMember := TRIM(@nextVar);


    -- Sanity check: is the user already in a team
    set @num := (select count(projectteam.userID) from PROJECT_TEAM projectteam
                JOIN PROJECT_LIST projectlist
                    ON projectteam.projectID = projectlist.projectID
                JOIN HACKATHON hackathon
                    ON projectlist.hackathon = hackathon.uid AND hackathon.active = 1 where userID = @teamMember);
    if @num > 0 then
      signal sqlstate '45000' set message_text = 'duplicate user detected';
      leave proc_lbl;
    end if;
    SET @loopList = INSERT(@loopList,1,@nextVarlen + 1,'');
    end LOOP;

  -- Generate a UID for the project and create the project entry
    set projectID_param := uuid();
    insert into PROJECT_LIST (projectID, projectName, hackathon) values (projectID_param, projectName_param, @hackathon_var);


    -- Prep to Loop
    set @loopList := teamUIDs_param;

  -- Loop over all team members again, inserting all associations to the project this time
    insertLoop: LOOP
    -- exit the loop if the list seems empty or was null;
    -- this extra caution is necessary to avoid an endless loop in the proc.
    IF LENGTH(TRIM(@loopList)) = 0 OR @loopList IS NULL THEN
      LEAVE insertLoop;
    END IF;

    -- capture the next value from the list
    SET @nextVar := SUBSTRING_INDEX(@loopList,',',1);

    -- save the length of the captured value; we will need to remove this
    -- many characters + 1 from the beginning of the string
    -- before the next iteration
    SET @nextVarlen := LENGTH(@nextVar);

    -- trim the value of leading and trailing spaces, in case of sloppy CSV strings
    SET @teamMember := TRIM(@nextVar);
    -- Add the team member
        insert into PROJECT_TEAM (userID, projectID) values (@teamMember, projectID_param);

    SET @loopList = INSERT(@loopList,1,@nextVarlen + 1,'');
    end LOOP;

  -- Prep to loop
  set @loopList := projectCategories_param;

  -- Loop over all categories, making associations to the project with each
    catLoop: LOOP
        -- exit the loop if the list seems empty or was null;
        -- this extra caution is necessary to avoid an endless loop in the proc.
        IF LENGTH(TRIM(@loopList)) = 0 OR @loopList IS NULL THEN
            LEAVE catLoop;
        END IF;

        -- capture the next value from the list
        SET @nextVar := SUBSTRING_INDEX(@loopList,',',1);

        -- save the length of the captured value; we will need to remove this
        -- many characters + 1 from the beginning of the string
        -- before the next iteration
        SET @nextVarlen := LENGTH(@nextVar);

        -- trim the value of leading and trailing spaces, in case of sloppy CSV strings
        SET @cat := TRIM(@nextVar);
--        set @cat := substring(projectCategories_param, @pos, @len);
        set @catNum := cast(@cat as unsigned);

    -- Make the association in project categories
    insert into PROJECT_CATEGORIES (projectID, categoryID) values (projectID_param, @catNum);

    -- rewrite the original string using the `INSERT()` string function,
        -- args are original string, start position, how many characters to remove,
        -- and what to "insert" in their place (in this case, we "insert"
        -- an empty string, which removes @nextVarlen + 1 characters)
        SET @loopList = INSERT(@loopList,1,@nextVarlen + 1,'');
    end LOOP;
end$$
