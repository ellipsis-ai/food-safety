function(location, date, time, incidentDescription, correctiveActions, file, ellipsis) {
  const box = ellipsis.require('ellipsis-box@0.2.1');
const boxFiles = box.files(ellipsis, ellipsis.env.BOX_CONFIG, ellipsis.env.BOX_APP_ENTERPRISE_ID);
const client = require('google-client')(ellipsis);
const {google} = require('googleapis');
const sheets = google.sheets('v4');
const moment = require('moment-timezone');
const timestamp = moment.tz(ellipsis.teamInfo.timeZone).format('M/D/YYYY HH:mm:ss');
const reporter = ellipsis.userInfo.fullName || ellipsis.userInfo.email || ellipsis.userInfo.userName;
const locationText = `${location.siteLabel} - ${location.label}`;

if (!ellipsis.env.FOOD_SAFETY_SHEET_ID || !ellipsis.env.FOOD_SAFETY_SHEET_NAME) {
  ellipsis.error("This skill requires two environment variables to be set so reports can be saved to a spreadsheet: FOOD_SAFETY_SHEET_ID and FOOD_SAFETY_SHEET_NAME");
} else {
  uploadAndSave();
}

function uploadAndSave() {
  uploadFile().then((fileInfo) => {
    const values = [[
      "",
      timestamp,
      reporter,
      locationText,
      date,
      time,
      incidentDescription,
      correctiveActions,
      fileInfo ? fileInfo.url : ""
    ]];
    return saveToSpreadsheet(values, fileInfo);
  });
}

function uploadFile() {
  return new Promise((resolve, reject) => {
    if (file) {
      file.fetch().then(fetchResult => {
        boxFiles.uploadWithTimestamp(fetchResult.filename, fetchResult.contentType, fetchResult.value).then(uploadResult => {
          resolve({ url: uploadResult.url, filename: fetchResult.filename });
        });
      });
    } else {
      resolve(null);
    }
  });
}

function saveToSpreadsheet(values, fileInfo) {
  const request = {
    spreadsheetId: ellipsis.env.FOOD_SAFETY_SHEET_ID,
    range: ellipsis.env.FOOD_SAFETY_SHEET_NAME,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: values
    },
    auth: client,
  };
  return client.authorize().then(() => {
    return sheets.spreadsheets.values.append(request);
  }).then((res) => {
    const updated = res.data.updates.updatedRows;
    if (updated == 0) {
      ellipsis.error(`Error saving to spreadsheet ${request.spreadsheetId}.`, {
        userMessage: "There was an error saving your report. Please try again or report the problem to the #ellipsis_support channel."
      });
    } else {
      ellipsis.success({
        timestamp: timestamp,
        reporter: reporter,
        location: locationText,
        dateTime: `${date} at ${time}`,
        incidentDescription: incidentDescription,
        correctiveActions: correctiveActions,
        fileInfo: fileInfo ? fileInfo.url : "(none)"
      });
    }
  });
}
}
