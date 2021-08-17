function popup(id) {
    var x = document.getElementById(id);
    x.style.display = "none";
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
}

function hidePopup(id) {
    var x = document.getElementById(id);
    x.style.display = "none";
}

function publishTaskTrial(name, type) { 
	var body = {}; 
	body.name = name; 
	body.type = type; 
	console.log("in publish");
	$.post('/publishTaskTrial', body, (data) => {
		if(data.status != 200){
			alert(data.error); 
		}
		location.reload(true); 
	}); 
}

function deleteTaskTrial(name, type){
	var body = {}; 
	body.name = name; 
	body.type = type; 
	console.log(body); 
	$.post('/deleteTaskTrial', body, (data) => {
		if(data.status != 200){
			alert(data.error); 
		} else {
			alert(data.message);
		}
		location.reload(true); 
	}); 
}

function editTaskTrial(name, type){
	console.log("in edit"); 
	
	if (type == "trial"){
		window.location.href = '/trials/edit/'+name; 
	} else {
		var body = {};
		body.name = name; 
		
		$.post('/editTask', body, (data) =>  {
			if(data.status != 200) {
				alert(data.error);
			} else {
				window.location.href = '/tasks/edit/'+name; 
			}
			
		}); 
		
	}
} 

function changeToEdit() {
	var x = document.getElementById("editContainer");
	var y = document.getElementById("displayContainer");
    if (x.style.display === "none") {
		y.style.display = "none";
        x.style.display = "block";
		$('#editOtherNotes').text(notes);
    } else {
		x.style.display = "none";
		y.style.display = "block";
		
    }
}

function selectAll(radioGroup, selectBtn, deselectBtn) {
	var selectAllBtn = document.getElementById(selectBtn)
	var deselectAllBtn = document.getElementById(deselectBtn)
	var radioButtons = document.getElementsByName(radioGroup);
    for(var i = 0; i < radioButtons.length; i++) {
        if(radioButtons[i].checked == false) {
            radioButtons[i].checked = true;
        }
	}
	selectAllBtn.style.display = "none";
	deselectAllBtn.style.display = "block";
}

function deselectAll(radioGroup, selectBtn, deselectBtn) {
	var selectAllBtn = document.getElementById(selectBtn)
	var deselectAllBtn = document.getElementById(deselectBtn)
	var radioButtons = document.getElementsByName(radioGroup);
    for(var i = 0; i < radioButtons.length; i++) {
        if(radioButtons[i].checked == true) {
            radioButtons[i].checked = false;
        }
	}
	deselectAllBtn.style.display = "none";
	selectAllBtn.style.display = "block";
}

// This function needs to remove the selected individauls from the trial with trialName
// and "refresh" the page to display the change
function unassign(trialName) {
	console.log('in unassign');
	//for every function subject seleted, unassign them to the trial. 
	//need an recursive function bc async programming.
	var i = 0; 
	var len = $("input:checkbox[name='assignedtoTrial']:checked").length;
	callNextUnassign(i, len);
	//location.reload(true);
}

// This function needs to give a pop up for each selected individual, one at a time,
// for the admin to provide meeting details. After the final pop up, the page should
// "refresh" to display the change
function assign(trialName) {
	console.log('inassign');
	//for every subject we need to call the '/assignToTrial', POST request and then 
	//pop up the meeting info popup.  
	var i = 0; 
	var len = $("input:checkbox[name='notAssignedtoTrial']:checked").length; 
	//need to make a recursive function to do this because asynchronous programming.
	callNextAssign(i,len);
}

function callNextUnassign(i,len){
	if(i < len) {
	var subject_id = $("input:checkbox[name='assignedtoTrial']:checked")[i].value; 
	//call the post request to unassign the user from the trial. 
	var	body = {}; 
	body.trial = trial;
	body.subject_id = subject_id;
	
	$.post('/removeFromTrial', body, (data) => {
		if(data.status != 200){
			alert(data.error);
		} else {
			callNextUnassign(i+1, len);
		}
		
	}); 
		
		


	} else if (i == len) {
		location.reload(true);
	}
}
function callNextAssign(i,len){
	if(i < len) {
		console.log(len);
		var subject_id =  $("input:checkbox[name='notAssignedtoTrial']:checked")[i].value; 
		var body = {}; 
		body.trial = trial;
		body.subject_id = subject_id;
		//call the post request to assign the user to the trial. 
		$.post('/assignToTrial', body, (data) => {
			console.log(subject_id + "assigned to trial.");
			if(data.status != 200){
				alert(data.error); 
			} else {
				console.log('got data');
				//set the title of the popup. 
				$('#meetingInfoHead').text("Set Meeting Information for Test Subject " + subject_id);
				
				popup("setInfoPopup"); //popup the set info popup. 
				
				//set the function for if they close the meeting info. should unassign participant.
				$('#close-meeting').click(function(){
					body = {}; 
					body.trial = trial;
					body.subject_id = subject_id; 
					
					$.post('/removeFromTrial', body, (data) => {
						if(data.status == 200){
							alert("Test Subject was not assigned to this trial."); 
						} 
						$("#close-meeting").unbind('click');
						hidePopup("setInfoPopup"); //close this popup.
						callNextAssign(i+1, len); 
					}); 
					
					
					
				}); 
				
				//set the function to send meeting data when it's sent. 
				$('[name="saveMeetingInfo"]').click(function(){
					
					body = {}; 
					body.trial = trial;
					body.subject_id = subject_id;
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
					console.log('in save meeting');
					$.post('/saveMeetingInfo', body, (data) => {
						console.log(subject_id + "meeting details set");
						if(data.status != 200){
							alert(data.error); 
						} else {
							//alert(data.message);
							//reload the page so we can see the changes.
							hidePopup("setInfoPopup");
							$('[name="saveMeetingInfo"]').unbind('click'); //unbind the click function. 
							callNextAssign(i+1, len); 
						}
						
					}); 
					
				}); 
				
					
			}
		}); 

		

	} else if (i == len) {
		location.reload(true);
	}
	
	
}

//This function takes the user to a view of the Trial information
function toTrial(trialName) {
	window.location.href = '/trial/'+trialName; 
}