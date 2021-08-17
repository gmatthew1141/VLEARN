$(document).ready(function () {
  $(window).on("load", function () {
    // Remove the cookie
    document.cookie = "trial=; expires=" + new Date().toUTCString() + ";path=/";
  });
});
