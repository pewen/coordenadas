/*****************************************
 * Change NavBar color on scroll
 ****************************************/
$(document).ready(function(){       
    var scroll_start = 0;
    var startchange = $('.first_element');
    var offset = startchange.offset();
    
    if (startchange.length){
	$(document).scroll(function() { 
	    scroll_start = $(this).scrollTop();
	    if(scroll_start > offset.top) {
		$(".navbar-inverse").css('background-color', '#2e3842');
	    } else {
		$(".navbar-inverse").css('background-color', 'transparent');
	    }
	});
    }
});
