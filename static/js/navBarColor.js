/*****************************************
 * Change NavBar color on scroll
 ****************************************/
$(document).ready(function() {
    // Calculate the offset used to change the navbar color
    var scroll_start = 0;
    var startchange = $('.first_element');
    var offset = startchange.offset();

    // style used on change
    var head = document.getElementsByTagName('head')[0];
    var style = document.createElement('style');
    style.type = 'text/css';

    var oldHover = document.createTextNode('.navbar-inverse .navbar-nav > li > a:hover { color: white; }');
    var changeHover = document.createTextNode('.navbar-inverse .navbar-nav > li > a:hover { color: #a2000c; }');

    style.appendChild(oldHover);
    head.appendChild(style);

    function setStyle() {
	if(scroll_start > offset.top) {
	    $(".navbar-inverse").css('background',
				     '-moz-linear-gradient(top,#fafafa,#f5f5f5)');
	    style.appendChild(changeHover);
	    head.appendChild(style);
	}
	else {
	    $(".navbar-inverse").css('background', 'transparent');
	    style.appendChild(oldHover);
	    head.appendChild(style);
	}
    }
    
    // Get the current position and set the inial style
    var scroll_start = document.documentElement.scrollTop || document.body.scrollTop;
    setStyle();
    
    if (startchange.length){
	$(document).scroll(function() { 
	    scroll_start = $(this).scrollTop();
	    setStyle();
	});
    }
});
