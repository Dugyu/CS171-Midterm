
// SVG Size
var margin = {top: 20, right: 10, bottom: 20, left: 10}

var W = 600 - margin.left - margin.right,
	H = 800 - margin.top - margin.bottom;

var visual = d3.select("#chart-area2").append("svg")
.attr("width", w)
.attr("height", h);

var globalDataById = {};

queue()
    .defer(d3.csv, "data/global-malaria-2015.csv")
    .await(function(error, malariaDataCsv){

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
            globalDataById[d.Code] = d;
          });
          console.log(globalDataById);
    })
