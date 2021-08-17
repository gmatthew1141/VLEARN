$(document).ready(function(){

	$("#download").click(function(){
		var files = ""
		$("input:checkbox[name='TaskDataTxt']:checked").each(function(){
			
			if(files.indexOf('=') === -1){
				files += "files=" + $(this).val(); 
			} else {
				
				files+= "=" + $(this).val(); 
			}
			
			console.log($(this).val());
			window.location = "/fileBrowser/download/" + files; 
		})
		
		
		
	}); 
	
	$("#deleteFiles").click(function(){
		
		var body = {};
		body.files = []; 
		
		$("input:checkbox[name='TaskDataTxt']:checked").each(function(){
			
			body.files.push($(this).val()); 
		
		}); 
		
		body.files = JSON.stringify(body.files);
		
		$.post('/fileBrowser/delete', body, (data) => {
			if(data.status != 200){
				alert(data.error);
			} else {
				alert(data.message); 
			} 
			location.reload(true);
		}); 
	}); 

}); 