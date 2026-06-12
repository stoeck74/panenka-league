const token = process.env.FOOTBALL_DATA_API_KEY;
fetch('https://api.football-data.org/v4/teams/524', { headers: { 'X-Auth-Token': token } })
  .then(r => r.json())
  .then(d => {
    console.log('Squad size:', d.squad?.length);
    console.log('Positions:', [...new Set(d.squad?.map(p => p.position))]);
    console.log('Sample:', JSON.stringify(d.squad?.slice(0,5).map(p => p.name + ' - ' + p.position)));
  })
