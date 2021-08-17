$(document).ready(function () {
  var path = window.location.pathname;
  path = path.split("/");
  console.log("path:", path);
  var taskname = path[path.length - 1]; //last thing here is the taskname.
  var timestamp = new Date().getTime();
  //add two new cookies for ask and timestamp
  document.cookie =
    "task=" + taskname + ";max-age=36000;path=/; SameSite=Strict;";
  document.cookie =
    "timestamp=" + timestamp + ";max-age=36000;path=/; SameSite=Strict;";
});
