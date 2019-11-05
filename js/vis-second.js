
// SVG Size
var margin = {top: 20, right: 10, bottom: 20, left: 40}

var W = 640 - margin.left - margin.right,
	H = 500 - margin.top - margin.bottom;
var padding = 10;
var visual = d3.select("#chart-area2").append("svg")
.attr("width", W + margin.left + margin.right)
.attr("height", H + margin.top + margin.bottom)
.append("g")
.attr("transform",`translate(${margin.left},${margin.top})`)

//x-axis
visual.append('g').attr("class","axis x-axis");
visual.append('g').attr("class","axis y-axis")

//Global Values
var globalDataById = [];
var highlight = d3.select("#highlight").property("value");
console.log(highlight)
queue()
    .defer(d3.csv, "data/global-malaria-2015.csv")
    .await(function(error, malariaDataCsv){

        malariaDataCsv.forEach(function(d){
            d.At_risk = parseFloat(d.At_risk);
            d.At_high_risk = parseFloat(d.At_high_risk);
            d.UN_population = parseInt(d.UN_population);
            d.Suspected_malaria_cases = parseInt(d.Suspected_malaria_cases);
            d.Malaria_cases = parseInt(d.Malaria_cases)
            
            if (!isNaN(d.Suspected_malaria_cases) && !isNaN(d.Malaria_cases) &&
                d.Suspected_malaria_cases < d.UN_population && d.Malaria_cases < d.UN_population
                && !isNaN(d.UN_population)
                && d.Suspected_malaria_cases != 0 && d.Malaria_cases != 0 && d.UN_population != 0
                ){
                    globalDataById.push(d);

                }
          });
          console.log(globalDataById);
          updateVisualization();
    })

function updateVisualization(){
    highlight = d3.select("#highlight").property("value");
    console.log(highlight);
    var xmax = d3.max(globalDataById, function(d){
        var value = d.Malaria_cases;
        if (isNaN(value)){value = -Math.Infinity;}
        return value;
    })
    var xmin = d3.min(globalDataById, function(d){
        var value = d.Malaria_cases;
        if (isNaN(value)){value = Math.Infinity;}
        return value;
    })

    var ymax = d3.max(globalDataById, function(d){
        var value = d.Suspected_malaria_cases;
        if (isNaN(value)){value = -Math.Infinity;}
        return value;
    })

    var ymin = d3.min(globalDataById, function(d){
        var value = d.Suspected_malaria_cases;
        if (isNaN(value)){value = Math.Infinity;}
        return value;
    })
    var sizemax = d3.max(globalDataById, function(d){
        var value = d.UN_population;
        if (isNaN(value)){value = -Math.Infinity;}
        return value;
    })
    var sizemin = d3.min(globalDataById, function(d){
        var value = d.UN_population;
        if (isNaN(value)){value = Math.Infinity;}
        return value;
    })


  

    var x = d3.scaleLog().domain([xmin,xmax])
                        .range([padding,W-padding])
    var y = d3.scaleLog().domain([ymin,ymax])
                        .range([H-padding,padding])
    var size = d3.scaleLog().domain([sizemin,sizemax])
                            .range([1,10])

    var xAxis = d3.axisBottom().scale(x).tickValues([1,10,100,1000,10000,100000,1000000,10000000,100000000]).tickFormat(d3.format(".2s"));
    var yAxis = d3.axisLeft().scale(y).tickValues([15,100,1000,10000,100000,1000000,10000000,100000000]).tickFormat(d3.format(".2s"));

    d3.select(".x-axis").attr("transform", `translate(0,${H} )`).call(xAxis);
    d3.select(".y-axis").attr("transform", `translate(0,0)`).call(yAxis);



    var circles = visual.selectAll("circle")
                    .data(globalDataById)
	circles.enter()
    .append("circle")
    .merge(circles)
    .transition(200)
    .attr("r", function(d){
			return size(d.UN_population);
    })
    .attr("cx",function(d){
        if (d.Malaria_cases)
		var cx = x(d.Malaria_cases);
		return cx;
    })
    .attr("cy",function(d){
		var cy = y(d.Suspected_malaria_cases);
        return cy;
    })
	.attr("fill", function(d){
        if (d.WHO_region == highlight){
            return '#ff3e55';
        }
		return "#888888";
    })
    .attr("opacity",0.8);
}


d3.select("#highlight").on("change", function(){
    updateVisualization();
  });