select CAPID,NameLast,NameFirst,Type,Unit,Expiration,MbrStatus
from Member 
	where MbrStatus = 'EXPIRED'
	order by Unit, NameLast;
