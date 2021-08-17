$(document).ready(function() {
	
	
	$('#createUserSubmit').click(function(event) {
		var body = {};
		body.subject_id = $('[name="TS#"]').val(); 
		body.username = $('[name="newUsername"]').val();
		body.password = $('[name="pswd"]').val(); 
		body.notes  = $('#createAccountOtherNotes').val(); 
		var verified  = $('[name="pswd2"]').val(); 
		if(body.password.normalize() !== verified.normalize()){
			alert('Passwords Do Not Match!'); 
		} else {
			$.post('/register', body, (data) => {
				if(data.status != 201) {
					alert(data.error); 
				} else {
					alert(data.message); 
				}				
		
			
		
			});
		}

	
		
		
	
	})
	
	//if we want to use this to generate random passwords. 
	function generateRandomPassword(length){ 
	
	const symbols = '#$%?@!'
	//numbers is ASCII 48-57
	//upper case is ASCII 65-90
	//lower case is ASCII 97-122
	
	var i = 0;
	
	//first thing in password must be a letter.  
	var x = Math.random(); 
	var ascii_val = 0
	if(x < 0.5) { 
		//lower case. 
		ascii_val = Math.floor((Math.random()*(122-97))+97) //97-122. 
		
	} else {
		//upper case. 
		ascii_val = Math.floor((Math.random()*(90-65))+97) //65-90. 
		
	} 
	
	
	var pass = String.fromCharCode(ascii_val)
	for(i = 0; i < length-1; i++){
		var x = Math.random(); //number between 0 and 1. 
		
		//generate a password character with 30% chance of upper, 30%lower, 25% ascii and 15% symbol. 
		if(x < 0.3){ 
			//upper case. 
			ascii_val = Math.floor((Math.random()*(122-97))+97); //97-122. 
			pass += String.fromCharCode(ascii_val);
		} else if( x >= 0.3 && x < 0.6){
			//lower case. 
			ascii_val = Math.floor((Math.random()*(90-65))+65); //65-90. 
			pass += String.fromCharCode(ascii_val);
		} else if( x >= 0.6 && x < 85){
			ascii_val = Math.floor((Math.random()*(57-48))+48); //48-57. 
			pass += String.fromCharCode(ascii_val);
		} else { 
			pass += symbols.charAt(Math.floor(Math.random()*symbols.length)); 
		}
		
		
	}
	
	return pass; 
}
	
	
	
}); 