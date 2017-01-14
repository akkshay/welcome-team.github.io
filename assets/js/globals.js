$(function() {

  const msgAnimateTime = 150;
  const msgShowTime = 2000;

  function msgFade(msgId, msgText) {
    msgId.fadeOut(msgAnimateTime, function() {
      $(this).text(msgText).fadeIn(msgAnimateTime);
    });
  }

  function msgChange(divTag, iconTag, textTag, divClass, iconClass, msgText) {
    var msgOld = divTag.text();
    msgFade(textTag, msgText);
    divTag.addClass(divClass);
    iconTag.removeClass("glyphicon-chevron-right");
    iconTag.addClass(iconClass + " " + divClass);
    setTimeout(function() {
      msgFade(textTag, msgOld);
      divTag.removeClass(divClass);
      iconTag.addClass("glyphicon-chevron-right");
      iconTag.removeClass(iconClass + " " + divClass);
    }, msgShowTime);
  }

  function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  function uiLoginCallback() {
    var email = $('#login_email').val();
    var password = $('#login_password').val();
    loginCallback(email, password);
    return false;
  }

  function uiLoginShowError(msg) {
    msgChange($('#div-login-msg'), $('#icon-login-msg'), $('#text-login-msg'), "error", "glyphicon-remove", msg);
  }

  function uiLoginShowSuccess(msg) {
    msgChange($('#div-login-msg'), $('#icon-login-msg'), $('#text-login-msg'), "success", "glyphicon-ok", msg);
  }

  function uiSetEventTitle(title) {
    $("#event_title").html(title);
  }

  function loginCallback(email, password) {
    firebase.auth().signInWithEmailAndPassword(email, password).then(function(user) {
      uiLoginShowSuccess("Success!");
    }).catch(function(error) {
      uiLoginShowError("Invalid Credentials");
    });
  }

  function assertIsAdminForEvent(uid) {
    var exists = false;
    return user_ref.child(uid).once("value").then(function(snapshot) {
      if(!snapshot.exists()) return firebase.Promise.reject(new Error("user does not exist"));
      var user = snapshot.val();
      if(!user.adminOrganizationIds) return firebase.Promise.reject(new Error("user is not admin of any event"));
      var plist = [];
      for(var i = 0; i < user.adminOrganizationIds.length; i++) {
        var orgId = user.adminOrganizationIds[i];
        plist.push(event_ref.child(orgId).child(eventId).once("value").then(function(snapshot) {
          if(!snapshot.exists()) return;
          exists = true;
          uiSetEventTitle(snapshot.val().name);
        }));
      }
      return firebase.Promise.all(plist);
    }).then(function() {
      if(!exists) return firebase.Promise.reject(new Error("eventId does not exist under orgId"));

    });
  }

  function authCallback(user) {
    if (!user) $("#login-modal").modal();
    else {
      assertIsAdminForEvent(user.uid).then(function() {
        $('#qrcode').qrcode({
          text: eventId || "temp"
        });
      }).catch(function(error) {
        return firebase.auth().signOut();
      });
    }
  }

  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyBpMKuXTeU-dODL_gdJWrmzXis_e339Fj4",
    authDomain: "welcome-816c9.firebaseapp.com",
    databaseURL: "https://welcome-816c9.firebaseio.com",
    storageBucket: "welcome-816c9.appspot.com",
    messagingSenderId: "384000919667"
  };
  firebase.initializeApp(config);

  var root_ref = firebase.database().ref();
  var event_ref = root_ref.child("Events");
  var user_ref = root_ref.child("Users");

  var page = window.location.pathname.split("/").pop().trim();
  var eventId = getParameterByName("eventId");

  firebase.auth().onAuthStateChanged(authCallback);

  $("form").submit(uiLoginCallback);
});