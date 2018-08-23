function(site, ellipsis) {
  const locations = require('ellipsis-fiix').locations(ellipsis);

locations.fetchLocations(site).then(objects => {
  ellipsis.success(objects.map(ea => {
    return {
      label: ea.strName,
      id: ea.id,
      siteLabel: site.label
    };
  }));
}).catch(err => ellipsis.error(JSON.stringify(err)));
}
