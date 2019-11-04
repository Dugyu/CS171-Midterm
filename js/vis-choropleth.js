// --> CREATE SVG DRAWING AREA
var width = 600;
var height = 600;

var svg = d3.select("#chart-area1").append("svg")
.attr("width", width)
.attr("height", height);

// Global Variables
var countryDataById = {};
var africa;


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

var colorLegend = svg.append("g")
                     .attr("class","legend")
var colorLegendText = svg.append("g")
                   .attr("class","legend-text")
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
    console.log(measure);
  
    // Update choropleth
    updateChoropleth();
  });
    



d3.select("#measure").on("change", function(){
    updateChoropleth();
  });
  d3.select("#detail-level").on("change", function(){
    updateChoropleth();
  });

function updateChoropleth() {
  //Update form value
  var detailLevel = parseInt(d3.select("#detail-level").property("value"));
  measure = d3.select("#measure").property("value");
  // --> Choropleth implementation
  //Update Scales
  var max = d3.max(africa, function(d){
      var code = d.properties.adm0_a3_is;
      var value;
      if(countryDataById[code] ){
        value = countryDataById[code][measure];
        if (isNaN(value)){
          value = 0;
        }
      }
      return value;
  })

  var min = d3.min(africa, function(d){
    var code = d.properties.adm0_a3_is;
    var value = Math.Infinity;
    if(countryDataById[code] ){
      var value = countryDataById[code][measure];
      if (isNaN(value)){
        value = Math.Infinity;
      }
    }
    return value;
})

  
if (measure == "UN_population"){
  color = d3.scaleLog().range([0,1]);
}
else{
  color = d3.scaleLinear().range([0,1]);
}
//color = d3.scaleLinear().range([0,1]);
color.domain([min,max])
  console.log(max);
  console.log(min);

  var range = Array.from(Array(detailLevel).keys())
  var legend = []
  range.forEach(e =>
    legend.push((e+1)/detailLevel)
    );


  var t = d3.transition()
  .duration(2000);

  
  // Draw legends
  var squares = colorLegend.selectAll("rect")
                .data(legend, function(d){return d})
  squares.enter()
        .append("rect")

        .merge(squares)
        .transition(t)
        .attr("class","legend")
        .attr("x", 520)
        .attr("y", function(d,i){return 280 + detailLevel * 10 - 20 * i})
        .attr("width",20)
        .attr("height",20)
        .style("fill",'#ff3e55')
        .style("opacity",function(d){return d})
  squares.exit().remove()

  var blocks = svg.selectAll("path")
            .data(africa)

// Draw legend texts
    legendextend = Array.from(legend); // add 0 to front
    legendextend.unshift(0.0);
    console.log(legendextend);
    
    var legendtexts = colorLegendText.selectAll("text")
                .data(legendextend, function(d){return d})
    
    legendtexts.enter()
              .append("text")

              .merge(legendtexts)
              .transition(t)
              .attr("class","legend-text")
              .attr("x", 550)
              .attr("y", function(d,i){return 285 + detailLevel * 10 - 20 * (i-1)})
              .style("fill","#aaaaaa")
              .text(function(d){return d3.format(".2s")(color.invert(d)) + units[measure]})
    legendtexts.exit().remove()


  // Draw map blocks
  blocks.enter()
  .append("path")

  .merge(blocks)
  .transition(t)
  .attr("class","map")
  .attr("d", mapPath)
  .style("fill", function(d){
    var code =  d.properties.adm0_a3_is 
    if(countryDataById[code] ){
      if(isNaN(countryDataById[code][measure])){
        return '#aaaaaa';
        }
      else{return '#ff3e55';}
      
      }else{
      return "#aaaaaa"
    }
  })
  .style("opacity",function(d){
    var code =  d.properties.adm0_a3_is 
    if(countryDataById[code] ){
        var value = countryDataById[code][measure];
        if (isNaN(value)){
          return 1.0;
        }
        else{
          return (Math.floor(color(value)*detailLevel) + 1) / detailLevel;
        }
      }else{
      return 1.0;
    }
  })

}