var myChart;

$(document).ready(function() {
    // Size of the scatterMap
    var div = document.getElementById('scatterMap'),
	divStyle = window.getComputedStyle(div),
	containerHeight = parseFloat(divStyle.height);

    // Padding top to use
    var paddingTop = (containerHeight - 400)/2;
    // Set the padding
    var plot = document.getElementById('deptoPlot');
    plot.style.paddingTop = 60 + 'px';
    
    var svg = d3.select("#deptoPlot");

    d3.csv("analisis/datos/cantidad_por_departamento.csv",
	   function (data) {
	       myChart = new dimple.chart(svg, data);

	       // Fix the margins
	       myChart.setMargins("60px", "30px", "110px", "70px");

	       var x = myChart.addCategoryAxis("x", "Departamento");
	       myChart.addMeasureAxis("y", "Cortaderos por departamento");
	       myChart.addSeries(null, dimple.plot.bar);
	       myChart.draw();
	   });
})

window.addEventListener('resize', function() {
    myChart.draw();
});
