
// SVG Size
var margin = {top: 40, right: 170, bottom: 20, left: 40}

var W = 800 - margin.left - margin.right,
	H = 580 - margin.top - margin.bottom;
var padding = 10;
var visual = d3.select("#chart-area2").append("svg")
.attr("width", W + margin.left + margin.right)
.attr("height", H + margin.top + margin.bottom)
.append("g")
.attr("transform",`translate(${margin.left},${margin.top})`)

//x-axis
visual.append('g').attr("class","axis x-axis");
visual.append('g').attr("class","axis y-axis");
visual.append('text').attr('class','axis-text x-text').attr('x' ,500).attr('y',H-20).text('Malaria Cases');
visual.append('text').attr('class','axis-text y-text').attr('x' ,20).attr('y',20).text('Suspected Malaria Cases');
visual.append('text').attr('class','chart-title-2').attr('x' ,W).attr('y',-20).text('Global Malaria Cases 2015: Suspected vs Diagnosed');

//Global Values
var globalDataById = [];
var highlight = d3.select("#highlight").property("value");

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

          globalDataById = globalDataById.sort(function(a,b){return -a.UN_population + b.UN_population})
          console.log(globalDataById)
          updateVisualization();
          initializeTooltip2();

    })

function updateVisualization(){
    highlight = d3.select("#highlight").property("value");
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
                            .range([3,10])

    var xAxis = d3.axisBottom().scale(x).tickValues([1,10,100,1000,10000,100000,1000000,10000000]).tickFormat(d3.format(".2s"));
    var yAxis = d3.axisLeft().scale(y).tickValues([15,100,1000,10000,100000,1000000,10000000,100000000]).tickFormat(d3.format(".2s"));

    d3.select(".x-axis").attr("transform", `translate(0,${H} )`).call(xAxis);
    d3.select(".y-axis").attr("transform", `translate(0,0)`).call(yAxis);

    var circles = visual.selectAll("circle")
                    .data(globalDataById)
	var circles2 = circles.enter()
                    .append("circle")
                    .merge(circles)
                    .attr("r", function(d){
                            return size(d.UN_population);
                    })
                    .attr("cx",function(d){
                        var cx = x(d.Malaria_cases);
                        return cx;
                    })
                    .attr("cy",function(d){
                        var cy = y(d.Suspected_malaria_cases);
                        return cy;
                    })
    circles2.transition(2000)
            .attr("fill", function(d){
                if (d.WHO_region == highlight){
                    return '#ff3e55';
                }
                return "#aaaaaa";
            })
            .attr("opacity",0.7);
    circles2.on('mouseenter',function(d){
        d3.select(this).style('stroke', "#eeeeee").style('stroke-width',2);
        focus2.transition(10).attr('transform', `translate(${x(d.Malaria_cases)}, ${y(d.Suspected_malaria_cases)})`);
        tooltip2.transition(1).style("opacity",0.9);
        d3.selectAll(".tooltip-text-2")
          .style('opacity',1);
        tooltipTextData2.forEach(function(e,id){
            var property = e;
            d3.select('#tooltip2-'+id)
                .transition(1)
                .text(tooltipTextName2[id] +": " + d[property]);
        })
    })
    circles2.on('mouseout',function(d,i){
        d3.select(this).style('stroke', 'none');
        tooltip2.transition(1).style("opacity",0);
        d3.selectAll(".tooltip-text-2")
          .style('opacity',0);
    })
}


d3.select("#highlight").on("change", function(){
    updateVisualization();
  });


var focus2;
var tooltipTextData2;
var tooltipTextName2;
var tooltip2;
var tooltipTexts2;

function initializeTooltip2() {
    focus2 = visual.append('g').attr('class', 'focus2');
    tooltipTextData2 = ["Country", "UN_population", "Suspected_malaria_cases",'Malaria_cases'];
    tooltipTextName2 = ["Country", "UN Population", "Suspected Malaria Cases", "Malaria Cases"];
    

    // 4 lines of tooltip texts showing detailed information
    tooltip2 = focus2.append('rect')
    .attr("width", 150)
    .attr("height", 50)
    .attr("x", 0)
    .attr("y", 0)
    .attr("id", "tooltip2")
    .style('fill','#cccccc')
    .style('opacity',0)
 
    tooltipTexts2 = [];

    tooltipTextData2.forEach(function(d,i){
        var temptext = focus2.append('text')
          .attr('class', 'tooltip-text-2')
          .attr('id', 'tooltip2-'+i)
          .style('fill','#000000')
          .attr('x', 8)
          .attr('y', 10 + i * 10)
          .style('font-size',10)
          .style("opacity",0)
          .attr('dy', '.35em');
        tooltipTexts2.push(temptext);
      });
}
