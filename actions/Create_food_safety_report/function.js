function(location, date, time, incidentDescription, correctiveActions, file, ellipsis) {
  const EllipsisApi = ellipsis.require('ellipsis-api@0.1.1');
const actionsApi = new EllipsisApi(ellipsis).actions;
const box = ellipsis.require('ellipsis-box@0.2.1');
const boxFiles = box.files(ellipsis, ellipsis.env.BOX_CONFIG, ellipsis.env.BOX_APP_ENTERPRISE_ID);
const client = require('google-client')(ellipsis);
const {google} = ellipsis.require('googleapis@33.0.0');
const sheets = google.sheets('v4');
const moment = require('moment-timezone');
const timestamp = moment.tz(ellipsis.teamInfo.timeZone).format('M/D/YYYY HH:mm:ss');
const reporter = ellipsis.userInfo.fullName || ellipsis.userInfo.email || ellipsis.userInfo.userName;
const locationText = `${location.siteLabel} - ${location.label}`;
const inspect = require('util').inspect;
const followUpUserId = ellipsis.env.FOOD_SAFETY_FOLLOW_UP_USER_ID;

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
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: values
    },
    auth: client
  };
  return client.authorize().then(() => {
    return sheets.spreadsheets.values.append(request);
  }).then((res) => {
    const updated = res.data.updates.updatedRows;
    if (updated == 0) {
      ellipsis.error(`Error saving to spreadsheet ID ${request.spreadsheetId}.`, {
        userMessage: `There was an error saving your report. Please try again or report the problem to the <@${followUpUserId}>.`
      });
    } else {
      const resultText = formatOutput({
        timestamp: timestamp,
        reporter: reporter,
        location: locationText,
        dateTime: `${date} at ${time}`,
        incidentDescription: incidentDescription,
        correctiveActions: correctiveActions,
        fileInfo: fileInfo ? fileInfo.url : "(none)",
        followUpUserId: followUpUserId
      });
      actionsApi.say({
        channel: ellipsis.env.FOOD_SAFETY_UPDATE_CHANNEL_ID,
        message: resultText
      }).then(() => {
        ellipsis.success(resultText);
      }).catch((err) => {
        console.log("An error occurred trying to announce the new safety report to the food safety updates channel:");
        console.log(inspect(err));
        ellipsis.success(resultText);
      });
    }
  }).catch((err) => {
    if (err && err.message && err.message.match(/The caller does not have permission/)) {
      ellipsis.error(`Permission denied by Google API while trying to update spreadsheet ID ${request.spreadsheetId}.`, {
        userMessage: `There was an error saving your report. Please report the problem to <@${followUpUserId}>.`
      });
    } else {
      throw err;
    }
  });
}

function formatOutput(successResult) {
  return `
# A new food safety report has been created with the following information:

**Time reported:** ${successResult.timestamp}
**Reported by:** ${successResult.reporter}
**Location:** ${successResult.location}
**When incident occurred:** ${successResult.dateTime}
**Description:** ${successResult.incidentDescription}
**Corrective actions:** ${successResult.correctiveActions}
**Image:** ${successResult.fileInfo}

Thank you for your report. You can follow up on this by contacting <@${successResult.followUpUserId}>.`;
}
}
