$(document).ready(function() {
	
	
	$('#login').click(function(event) {
		var body = {};
		body.username = $('[name="username"]').val();
		body.password = $('[name="password"]').val(); 
		
		$.post('/authenticate', body).always((data) => {
			if(data.statusCode != 200) {
				alert(data.responseJSON.message); 
			} else {
				console.log(data);
				//store the token in a sitewide cookie. 
				document.cookie = "token=" + data.token + "; max-age=" + data.expiresIn + ";path=/; SameSite=Strict;";
				document.cookie = "username=" + body.username + "; max-age=" + data.expiresIn + ";path=/; SameSite=Strict;";
				
				
				//redirect to home page. 
				window.location.href = '/home';
			
				
			}				
			
		
		})
		
	
	})
	
	
	
	
}); 