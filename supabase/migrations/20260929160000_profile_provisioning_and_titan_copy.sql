-- Reviewable data correction only. Profile provisioning already exists via public.handle_new_user().
update public.titan_challenges set description='10 strict pull-ups' where slug='pullups';
update public.titan_challenges set description='100 bodyweight squats' where slug='squats';
