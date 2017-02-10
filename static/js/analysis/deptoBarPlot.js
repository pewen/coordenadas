$(document).ready(function() {
    var svg = dimple.newSvg("#deptoPlot", 590, 400);
    d3.csv("analisis/datos/cantidad_por_departamento.csv",
	   function (data) {
	       var myChart = new dimple.chart(svg, data);
	       myChart.setBounds(60, 30, 510, 305)
	       var x = myChart.addCategoryAxis("x", "Departamento");
	       myChart.addMeasureAxis("y", "Cortaderos por departamento");
	       myChart.addSeries(null, dimple.plot.bar);
	       myChart.draw();
	   });
})
