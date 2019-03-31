/* assignTable procedure
 *
 * Assigns a table to a given group project with category requirements.  
 * 
 * In:
 *   projectID_param (char(36)): The UID for a project within a given hackathon.
 *  categoryID_param (int(11)): The category ID for the project.
 * Out:
 *  tableNumber_param (int(11)): The table number assigned to the project.
 *
 * Requires:
 *  `select ? for update` locking syntax
 *
 * Warnings:
 *  If the query does not successfully return, the selected table will deadlock
 *
*/
DROP PROCEDURE IF EXISTS `assignTable`;
DELIMITER $$
CREATE PROCEDURE `assignTable`(in projectID_param char(36), in categoryID_param int(11), out tableNumber_param int(11))
begin
  -- Get the current hackathon ID
  set @hackathon_var := (select `uid` from `HACKATHON` where `active` = 1);
  -- Pick a table number not in TABLE_ASSIGNMENTS & lock the table being assigned
    set tableNumber_param := 
        (select tableID from TABLE_SUPPORT 
            where categoryID = categoryID_param and hackathon = @hackathon_var and tableID not in (select tableNumber from TABLE_ASSIGNMENTS where hackathon = @hackathon_var)
                order by priority desc limit 1 for update);
  -- Check for null table number - this indicates that no acceptable tables are available
    if tableNumber_param is not null then
    -- Update to TABLE_ASSIGNMENTS to have the association
        insert into TABLE_ASSIGNMENTS (tableNumber, projectID, hackathon) values (tableNumber_param, projectID_param, @hackathon_var);
    end if;
  -- NOP to release the lock on the table
    update TABLE_SUPPORT set tableID = tableNumber_param where tableID = tableNumber_param and hackathon = @hackathon_var; 
end$$
