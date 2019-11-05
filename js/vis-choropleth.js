// --> CREATE SVG DRAWING AREA
var width = 600;
var height = 600;

var svg = d3.select("#chart-area1").append("svg")
.attr("width", width)
.attr("height", height);

// Global Variables
var countryDataById = {};
var africa;
var focus;
var tooltip;
var tooltipTextData;
var tooltipTextName;
var tooltipTexts;

// Scales
var color;
var measure = d3.select("#measure").property("value");
var detailLevel = parseInt(d3.select("#detail-level").property("value"));

// Map Projection: Mercator
var projection = d3.geoMercator()
    .translate([width / 2, height / 2])
    .scale(350)
    .center([27,0])    
var mapPath = d3.geoPath()
    .projection(projection)

// legend squares and units
var colorLegend = svg.append("g")
                     .attr("class","legend")
var colorLegendText = svg.append("g")
                   .attr("class","legend-text")
// legend units
var units = {"UN_population":"", "At_risk":"%","At_high_risk":"%","Suspected_malaria_cases":"",'Malaria_cases':""}

// Use the Queue.js library to read two files
queue()
  .defer(d3.json, "data/africa.topo.json")
  .defer(d3.csv, "data/global-malaria-2015.csv")
  .await(function(error, mapTopJson, malariaDataCsv){

    // --> PROCESS DATA
    // Convert TopoJSON to GeoJSON (target object = 'adm0_a3_is')
    africa = topojson.feature(mapTopJson, mapTopJson.objects.collection).features
    malariaDataCsv.forEach(function(d){
      d.At_risk = parseFloat(d.At_risk);
      d.At_high_risk = parseFloat(d.At_high_risk);
      d.UN_population = parseInt(d.UN_population);
      d.Suspected_malaria_cases = parseInt(d.Suspected_malaria_cases);
      d.Malaria_cases = parseInt(d.Malaria_cases)
      if (d.Suspected_malaria_cases > d.UN_population){
        d.Suspected_malaria_cases = NaN
      }
      if(d.Malaria_cases > d.UN_population){
        d.Malaria_cases = NaN
      }
      countryDataById[d.Code] = d;
    }) 

    console.log(countryDataById);
    console.log(africa);
    // Update choropleth
    updateChoropleth();
    initializeTooltip();   
  });
    



d3.select("#measure").on("change", function(){
    updateChoropleth();
  });
  d3.select("#detail-level").on("change", function(){
    updateChoropleth();
  });

function updateChoropleth() {
  // --> Choropleth implementation

  //Update form value
  var detailLevel = parseInt(d3.select("#detail-level").property("value"));
  measure = d3.select("#measure").property("value");

  //Update Scales
  var max = d3.max(africa, function(d){
      var code = d.properties.adm0_a3_is;
      var value;
      if(countryDataById[code] ){
        value = countryDataById[code][measure];
        if (isNaN(value)){value = 0;}}
      return value;})

  var min = d3.min(africa, function(d){
    var code = d.properties.adm0_a3_is;
    var value = Math.Infinity;
    if(countryDataById[code] ){
      var value = countryDataById[code][measure];
      if (isNaN(value)){value = Math.Infinity;}}
    return value;})

  // choose proper scale
  if (measure == "UN_population"){color = d3.scaleLog().range([0,1]);}
  else{color = d3.scaleLinear().range([0,1]);}
  
  // update scale domain
  color.domain([min,max])

  // unify transition speed
  var t = d3.transition().duration(2000);

  // prepare data for drawing legend squares
  var range = Array.from(Array(detailLevel).keys())
  var legend = []
  range.forEach(e =>legend.push((e+1)/detailLevel));
  extend = Array.from(legend);
  extend.unshift(-1);
  // Draw legend squares
  var squares = colorLegend.selectAll("rect")
                           .data(extend, function(d){return d})
  squares.enter()
        .append("rect")
        .merge(squares)
        .transition(t)
        .attr("class","legend")
        .attr("x", 520)
        .attr("y", function(d,i){
          var dist =280 + detailLevel * 10 - 20 * (i-1);
          if (i == 0){
            return dist + 15;
          }
          else{
            return dist
          }})
        .attr("width",20)
        .attr("height",20)
        .style("fill",function(d,i){
          if(i == 0){
            return "#aaaaaa"
          }
          else{
            return "#ff3e55"
          }
        })
        .style("opacity",function(d,i){
          if(i == 0){
            return 1.0
          }
          else{
            return d;
          }
          })
  squares.exit().remove()

  // Prepare data for legend texts
  legendextend = Array.from(legend); // deep copy of legend
  legendextend.unshift(-1,0.0); // add -1, 0 to front
    
  // Draw legend texts
  var legendtexts = colorLegendText.selectAll("text")
              .data(legendextend, function(d){return d})
  legendtexts.enter()
            .append("text")
            .merge(legendtexts)
            .transition(t)
            .attr("class","legend-text")
            .attr("x", 550)
            .attr("y", function(d,i){
              dist = 285 + detailLevel * 10 - 20 * (i-2);
              if(i == 0){
                return dist + 5;
              }
              else{
                return dist;
              }
              
            })
            .style("fill","#aaaaaa")
            .text(function(d,i){
              if (i == 0){
                return "NA";
              }
              else{ return d3.format(".2s")(color.invert(d)) + units[measure]  }
             })
  legendtexts.exit().remove()
  // Draw map blocks
  var blocks = svg.selectAll("path")
                  .data(africa)
  var blocks2 = blocks.enter()
                .append("path")
                .merge(blocks)        
                .attr("class","map")
                .attr("d", mapPath)
        
  blocks2.transition(t)
        .style("fill", function(d){
          var code =  d.properties.adm0_a3_is 
          if(countryDataById[code] ){
            if(isNaN(countryDataById[code][measure])){return '#aaaaaa';}
            else{return '#ff3e55';}}
          else{return "#aaaaaa"}})
        .style("fill-opacity",function(d){
          var code =  d.properties.adm0_a3_is 
          if(countryDataById[code] ){
            var value = countryDataById[code][measure];
            if (isNaN(value)){return 1.0;}
            else{return (Math.floor(color(value)*detailLevel) + 1) / detailLevel;}}
          else{return 1.0;}})
        

 blocks2.on('mouseenter', function(d,i){
            var code =  d.properties.adm0_a3_is ;
            d3.select(this).style('stroke', "#ffffff").style('stroke-width',2);
            var centroid = mapPath.centroid(d)

            focus.transition(10).attr('transform', `translate(${centroid[0]}, ${centroid[1]})`);
            tooltip.transition(1).style("opacity",0.9);
            
            d3.selectAll(".tooltip-text")
            .style('opacity',1);

            if(countryDataById[code] ){
              tooltip.attr("height",70);
              tooltipTextData.forEach(function(e,id){
                var data = countryDataById[code];
                var property = e;
                d3.select('#tooltip-'+id)
                .transition(1)
                .text(tooltipTextName[id] +": " + data[property]);
              })
            }
            else{
              tooltip.attr("height",30);
              tooltipTextData.forEach(function(e,id)
              {
                if (id == 0 ){
                  d3.select('#tooltip-'+id)
                  .transition(1)
                  .text(tooltipTextName[id] +": " + d.properties.admin);}
                else if (id == 1 ){
                    d3.select('#tooltip-'+id)
                    .transition(1)
                    .text("Estimated Population" +": " + d.properties.pop_est);}
                  
                else{
                  d3.select('#tooltip-'+id)
                  .transition(1)
                  .text("")}
              })
            }
          })
          .on('mouseleave',function(d,i){
            d3.select(this).style('stroke', 'none');
            tooltip.transition(1).style("opacity",0);
          d3.selectAll(".tooltip-text")
          .style('opacity',0);
            
          }) 

}
function initializeTooltip() {
  // tooltip
  focus = svg.append('g').attr('class', 'focus');
  tooltipTextData = ["Country", "UN_population","At_risk","At_high_risk", "Suspected_malaria_cases",'Malaria_cases'];
  tooltipTextName = ["Country", "UN Population", "At Risk", "At High Risk", "Suspected Malaria Cases", "Malaria Cases"];
  // 6 lines of tooltip texts showing detailed information
  tooltip = focus.append('rect')
              .attr("width", 150)
              .attr("height", 70)
              .attr("x", 0)
              .attr("y", 0)
              .attr("id", "tooltip")
              .style('fill','#ffffff')
              .style('opacity',0)
             
  tooltipTexts = [];
  
  tooltipTextData.forEach(function(d,i){
    var temptext = focus.append('text')
      .attr('class', 'tooltip-text')
      .attr('id', 'tooltip-'+i)
      .style('fill','#000000')
      .attr('x', 8)
      .attr('y', 10 + i * 10)
      .style('font-size',10)
      .style("opacity",0)
      .attr('dy', '.35em');
    tooltipTexts.push(temptext);
  });

}

