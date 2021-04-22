#!/bin/bash

mv cheapest-days-calendar.ics cheapest-days-calendar.`date +%Y%m%d`.ics
/opt/homebrew/bin/wget "https://p53-caldav.icloud.com/published/2/NTQwODcyNzI1NDA4NzI3MpkH3cPaYZB7Aft1DF0lwdUD2eN0RuRYdis2ihAKL4f84p43NfHkg7VIGNe2p7mOAdJw9o1zG_cINYh7hTZHpH0" -O cheapest-days-calendar.ics