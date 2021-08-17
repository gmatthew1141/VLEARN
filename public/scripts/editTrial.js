$(document).ready(function(){

	$("#editTrialSave").click(function(){
		var body = {}; 
		console.log('here');
		body.name = trial_name;
		body.newName = $('[name="trial_name"]').val(); 
		body.prelim_survey = $('[name="preSurveyURL"]').val(); 
		body.main_survey = $('[name="mainSurveyURL"]').val(); 
		body.post_survey = $('[name="postSurveyURL"]').val(); 
		body.video = $('[name="videoURL"]').val(); 
		body.task = $('[name="selectPublishedTask"] option:selected').text(); 
		//body.numBumps = $('[name="numBumps"]').val() || 3; 
		if(body.task == "Tower of Hanoi"){
            body.numBumps = parseInt( $('[name="numBumps"] option:selected').val() );
        }
        else{
            body.numBumps = $('[name="numBumps"]').val() || 3;
        }
        
		if( $('[name="trashSize"] option:selected').val() == 'small'){
            body.trashSize = 1;
        } else{
            body.trashSize = 1.5;
        }

		// if($('[name="pipe1"]').is(":checked")){
        //     body.pipe1 = "t";
        // } else { body.pipe1 = "f"; }
        // if($('[name="pipe2"]').is(":checked")){
        //     body.pipe2 = "t";
        // } else { body.pipe2 = "f"; }
    	// if($('[name="pipe3"]').is(":checked")){
        //     body.pipe3 = "t";
        // } else { body.pipe3 = "f"; }
        // if($('[name="pipe4"]').is(":checked")){
        // 	body.pipe4 = "t";
		// } else {body.pipe4 = "f"; }

		

		body.pipe1 = $('[name="pipe1"]').is(":checked");
		body.pipe2 = $('[name="pipe2"]').is(":checked");
		body.pipe3 = $('[name="pipe3"]').is(":checked");
		body.pipe4 = $('[name="pipe4"]').is(":checked");

		$.post('/editTrial', body, (data) => {
			if(data.status != 200){
				alert(data.error); 
			} else {
				alert(data.message);
				window.location.href = '/trialRepo';
			}
		}); 
		
	
	}); 

	$('#assignConfirm').click(function(){
		var body = {};
		body.name = $('#newTaskNameInput').val(); 
		console.log('in assign');
		$.post('/saveTask', body, (data) => {
			if(data.status != 201) {
				alert(data.error); 
			} else {
				window.location.href='/tasks/edit/' + body.name;
			}
		}); 
	});



}); 