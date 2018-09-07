function(ellipsis) {
  const EllipsisApi = ellipsis.require("ellipsis-api@0.1.1");
const api = new EllipsisApi(ellipsis).actions;
const now = new Date();
api.run({
  actionName: "Create food safety report",
  args: [{
    name: "date",
    value: now.toLocaleDateString(),
  }, {
    name: "time",
    value: now.toLocaleTimeString()
  }, {
    name: "incidentDescription",
    value: "Test incident description"
  }, {
    name: "correctiveActions",
    value: "Test corrective actions"
  }, {
    name: "file",
    value: "none"
  }]
}).then(() => {
  ellipsis.noResponse();
});
}
