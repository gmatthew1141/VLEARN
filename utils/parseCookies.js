//function parseCookies from Ido and Corey Hart on stack overflow.
// acquired by VLearn team 1
function parseCookies(request) {
  let list = {},
    rc = request.headers.cookie;

  rc &&
    rc.split(";").forEach(function (cookie) {
      let parts = cookie.split("=");
      list[parts.shift().trim()] = decodeURI(parts.join("="));
    });

  return list;
}

module.exports = parseCookies;
