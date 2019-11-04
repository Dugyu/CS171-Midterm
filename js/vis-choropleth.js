// --> CREATE SVG DRAWING AREA
var width = 800;
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
    .center([20,0])    
var mapPath = d3.geoPath()
    .projection(projection)

var colorLegend = svg.append("g")
                     .attr("class","legend")


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

color.domain([min,max]);
  
  console.log(max);
  console.log(min);
  var blocks = svg.selectAll("path")
            .data(africa)


  blocks.enter()
  .append("path")

  .merge(blocks)
  .transition(2000)
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
          return Math.ceil(color(value) * detailLevel) / detailLevel;
        }
      }else{
      return 1.0;
    }
  })

}