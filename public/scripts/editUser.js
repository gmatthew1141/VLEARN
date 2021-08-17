$(document).ready(function(){

	var body = {}; 
	$("#editUserDeleteConfirm").click(function(){
		body = {}; 
		body.user = id; 
		console.log('hello');
		console.log(id); 
		$.post('/deleteUser', body, (data) => {
			if(data.status != 200){
				alert(data.error); 
			} else {
				alert(data.message); 
				window.location.href = '/home'
			}
		}); 
		
		
	}); 
	
	$("#editUserSave").click(function(){
		body = {}; 
		body.subject_id = id;
		body.username = $('[name="TSuser"]').val();
		body.password = $('[name="pswd"]').val(); 
		body.notes  = $('#editOtherNotes').val(); 
		var verified  = $('[name="pswd2"]').val();
		
		console.log(body);
		if(body.password.normalize() !== verified.normalize()){
			alert('Passwords Do Not Match!'); 
		} else {
			$.post('/editUser', body, (data) => {
				if(data.status != 200) {
					alert(data.error); 
				} else {
					alert(data.message + "\nPlease send the user their updated information via email."); 
				}				
		
			
		
			});
		}
	}); 
	
	$('#close-meeting').click(function(){
		body = {}; 
		body.trial = $('#publishedTrials option:selected').text();
		body.subject_id = id; 
		
		
		$.post('/removeFromTrial', body, (data) => {
			if(data.status == 200){
				alert("Test Subject was not assigned to this trial."); 
			}
		}); 
		hidePopup("setInfoPopup"); //close this popup.
	}); 
	
	$("#assignConfirm").click(function(){
		body = {}
		body.trial = $('#publishedTrials option:selected').text();
		body.subject_id = id;
		$.post('/assignToTrial', body, (data) =>  {
			if(data.status != 200) {
				alert(data.error); 
			} else {
				//alert(data.message); 
				$('#meetingInfoHead').text("Set Meeting Information for Test Subject " + id +" and " + body.trial);
				popup("setInfoPopup"); //bring up the meeting inof popup. 
				hidePopup("createPopup") //close the assign popup. 
			
			}
		}); 
	}); 
	
	//set the function for the save meetingInfo button. 
	$('[name="saveMeetingInfo"]').click(function(){
		body = {}; 
		body.trial = $('#publishedTrials option:selected').text();
		body.subject_id = id;
		//now grab the data for the meeting info and use it to assign users. 
		var day = $('#day').val(); 
		var month = $('#month').val();
		var year = $('#year').val(); 
		
		body.date = month + '/' + day + '/' + year; 
		
		var hour = $('#hour').val();
		var minute= $('#minute').val(); 
		var ampm = $('#AMPM option:selected').text(); 
		
		body.meeting_id = $('#meetingid').val();
		body.time = hour + ":" + minute + ":00 " + ampm; 
		
		body.numTrials = $('#numTrials').val();
		console.log('in click');
		$.post('/saveMeetingInfo', body, (data) => {
			if(data.status != 200){
				alert(data.error); 
			} else {
				alert(data.message);
				//reload the page so we can see the changes.
				location.reload(true);
			}
		}); 
		
	}); 
}); 