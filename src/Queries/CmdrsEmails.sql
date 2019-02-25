select DutyPosition.CAPID, DutyPosition.Duty, DutyPosition.Lvl, Google.primaryEmail
from DutyPosition
inner join Google on DutyPosition.CAPID = Google.externalIds.value
where DutyPosition.Asst = 0 and (DutyPosition.Duty  = 'Commander' or DutyPosition.Duty like 'Deputy Commander%' or DutyPosition.Duty like 'Personnel Off%');
