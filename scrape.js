
const begin = "http://www.philosophizethis.org/sitemap.xml";


const stopWords = [ // Words to disclude from word count - taken from microsoft PowerBI-Visuals-WordCloud
    "a", "amazon", "about", "above", "above", "across", "ad", "after", "afterwards", "again", "against", "all", "almost", 
    "alone", "along", "already", "also","although","always","am","among", "amongst", "amoungst", "amount",  
    "an", "and", "another", "any","anyhow","anyone","anything","anyway", "anywhere", "are", "aren't", "around", "as",  
    "at", "back", "bc", "be","became", "because","become","becomes", "becoming", "been", "before", "beforehand", "behind", 
    "being", "below", "beside", "besides", "between", "beyond", "bill", "both", "bottom","but", "by", "call", 
    "can", "cannot", "cant", "co", "con", "could", "couldnt", "cry", "de", "describe", "detail", "do", "done", "don't", 
    "down", "due", "during", "each", "eg", "eight", "either", "eleven","else", "elsewhere", "empty", "enough", "episode", 
    "etc", "even", "ever", "every", "everyone", "everything", "everywhere", "except", "few", "fifteen", "fify", 
    "fill", "find", "fire", "first", "five", "for", "former", "formerly", "forty", "found", "four", "from", 
    "front", "full", "further", "get", "give", "go", "going", "had", "has", "hasnt", "have", "he", "hello", "hence", "her", 
    "here", "hereafter", "hereby", "herein", "hereupon", "hers", "herself", "him", "himself", "his", "how",
    "however", "hundred", "i", "ie", "if", "i'll", "in", "inc", "indeed", "interest", "into", "is", "it", "its", "it’s", "itself", "just",
    "keep", "last", "latter", "latterly", "least", "less", "let's", "like", "ltd", "made", "many", "may", "me", "meanwhile", 
    "might", "mill", "mine", "more", "moreover", "most", "mostly", "move", "much", "must", "my", "myself", 
    "name", "namely", "neither", "never", "nevertheless", "next", "nine", "no", "nobody", "none", "noone", 
    "nor", "not", "nothing", "now", "nowhere", "of", "off", "often", "on", "once", "one", "only", "onto", "or", 
    "other", "others", "otherwise", "our", "ours", "ourselves", "out", "over", "own","part", "per", "perhaps", 
    "please", "put", "rather", "re", "same", "see", "seem", "seemed", "seeming", "seems", "serious", "several", 
    "she", "should", "show", "side", "since", "sincere", "six", "sixty", "so", "some", "somehow", "someone", 
    "something", "sometime", "sometimes", "somewhere", "still", "such", "take", "ten", "than", 
    "that", "the", "their", "them", "themselves", "then", "thence", "there", "thereafter", "thereby", "therefore", 
    "therein", "thereupon", "these", "they", "thick", "thin", "third", "this", "those", "though", "three", 
    "through", "throughout", "thru", "thus", "to", "together", "too", "top", "toward", "towards", "transcript", "twelve", 
    "twenty", "two", "un", "under", "until", "up", "upon", "us", "very", "via", "was", "we", "well", "were", 
    "what", "whatever", "when", "whence", "whenever", "where", "whereafter", "whereas", "whereby", "wherein",
    "whereupon", "wherever", "whether", "which", "while", "whither", "who", "whoever", "whole", "whom", "whose", 
    "why", "will", "with", "within", "without", "would", "year", "years", "yet", "you", "your", "you're", "yours", "yourself", "yourselves", "the", "stephen", "west",
    "sponsor", "i'm"
    ];

function query() {
	
	(async () => {
	try {
		const result = await getPageData(begin); // Get the sitemap's XML data
		const resultXML = await parseXML(result); // Parse the JSON into an XML document
		const elinks = await getEpisodes(resultXML); // Get URL list for episode links
		const epages = await Promise.all(elinks.map(d => getPageData(d)));
		const edata = await Promise.all(epages.map(d => parseHTML(d)));
		const titles = await getEpisodeTitles(edata); // Create array for all episode titles by parsing HTML
		//const titles = await Promise.all(edata.map(d => getEpisodeTitles(d)));
		const locdata = await getTranscripts(resultXML); // Get URL list for transcript links
		const episodes = await associateEpisodes(titles, locdata); // Associate each transcript link with a title to store

		await appendTranscripts(episodes); // Create all transcripts in selection box

	} catch(err) {
		console.log(err);
	}
	}) ();
$("#query").attr("disabled", "disabled");
$("#qSubmit").attr("disabled", null);
}
function tQuery() {
	
	(async () => {
	try {
		const selected = await $("#tSelect").find("option:selected").map(function() { return $(this).attr("href"); }).get(); // Get all selected transcripts
		const pages = await Promise.all(selected.map(d => getPageData(d)));
		const tsc = await Promise.all(pages.map(d => parseHTML(d)));
		const transcripts = await Promise.all(tsc.map(d => parseTranscriptData(d)));
		const scrubbed = await scrubParagraphs(transcripts); // Clean up the transcripts and change them to a string
		const frequency = await getFrequencies(scrubbed);
		const stats = await getStats(frequency);
		await appendFrequency(scrubbed, frequency);

		await createGraph(frequency);	

	} catch(err) {
		console.log(err);
	}
	}) ();

}

function getPageData(link) {
	return $.getJSON('https://api.allorigins.win/get?url=' + encodeURIComponent(link));
}
function parseXML(data) {
	return $.parseXML(data.contents);
}
function parseHTML(data) {
	return $($.parseHTML(data.contents));
}
// Gets all transcript titles from XML sitemap
// data MUST be in the form of an XML webpage object
function getTranscripts(data) {
    var links = Array.from(data.getElementsByTagName("loc")).filter(d => d != null && d.textContent.includes("transcript")); // Create an array of each loc element, and filter for all transcripts

    var tsc = []; // Create array of all transcript links
    links.forEach(function(d) {
    	tsc.push(d.textContent);
    });
    return tsc;
}

// Gets all episode links from XML sitemap
// data MUST be in the form of an XML webpage object
function getEpisodes(data) {
    var links = Array.from(data.getElementsByTagName("loc")).filter(d => d != null && !d.textContent.includes("transcript"));

    var tsc = []; // Create array of all episode links
    links.forEach(function(d) {
    	tsc.push(d.textContent);
    });
    return tsc;
}

// Gets all episode titles from an HTML webpage object
// data MUST be in the form of an HTML webpage object
// Returns a dictionary in the format of episode # -> description
function getEpisodeTitles(data) {
	
	// Code for array-oriented approach
	var titles = {};
	var ttls = data.map(d => d.find('h1').text()).filter(d => d.toLowerCase().includes("episode")); // Find the episode description(usually the only h1 tag on the page)

	ttls.forEach(function(d) {
		var title = d.split("-");
		var description = title.slice(1).join("").trim(); // Include some titles with extra hyphens in their description, trim the whitespace too!
		if(description.length < 100 && description != "") { // Filters out ??? big descriptions ??? just don't take it out
		 titles[parseInt(title[0].match(/[1-9]\d*|0\d+/g)[0])] = description; // index a regex matching of all numbers followed by the description
		}
		
	});
	
	
	// Code for single value approach
	//var ttl = data.map(d => d.find('h1').text()).filter(d => d.toLowerCase().includes("episode"));
	
	//var title = ttl.split("-");
	//var description = title.slice(1).join("").trim(); // Include some titles with extra hyphens in their description, trim the whitespace too!
	//if(description.length < 100 && description != "") { // Filters out ??? big descriptions ??? just don't take it out
	//titles[parseInt(title[0].match(/[1-9]\d*|0\d+/g)[0])] = description; // index a regex matching of all numbers followed by the description

	return titles;
}
function parseTranscriptData(data) {
	
	var collection = [];
	var txt = data.find('p').each(function() {
		if($(this).text().length > 50) {
			collection.push($(this).text());
		}
	});
	return collection;
}
/*
	Create a transcript box and append its script text, given:
	data - an array of strings containing the transcript
*/
function appendTranscript(data) {
	
	d3.select("#transcript")
		.selectAll("p")
		.data(data)
		.enter().append("p")
		.attr("class", "my-0")
		.text(function(d) { return d; });
}


/*
	Returns an array in the format [Episode Title, Transcript Link], given:
	-an array of titles in the format [Episode #, Episode Title]
	-an array of transcript links
	This is accomplished by:
	-iterating through all transcript links
	-regular expression matching any number from the link
	-matching this with a number from the titles array
	-pushing the episode title, link to an array
	-returning the array 
*/
function associateEpisodes(titles, links) {
	var episodes = {}; // dictionary in the intended format of description -> link
	links.forEach(function(d) {
		if(!d.includes("episode")) {
			var spl = d.split("/");
			var ename = spl[spl.length-1];
			episodes[d] = ename;
		} else {
			var num = parseInt(d.match(/[1-9]\d*|0\d+/g));
			if(titles[num]) {
				episodes[d] = num + " ---> " + titles[num];
			}
		}
		
	});


	var sorted = d3.entries(episodes).sort(function(f, s) {
		var i = parseInt(f.value.split(" ")[0]);
		var ii = parseInt(s.value.split(" ")[0]);
		if(i != NaN && ii == NaN) return -1;
		else if(i == NaN && ii != NaN) return 1;
		else if(i == NaN && ii == NaN) return 0;
		else return i - ii;
		//else return (i != NaN && ii != NaN) ? i - ii : 0; 
		
	});
	
	return sorted;
}
function appendTranscripts(data) {

	//var data = d3.entries(datum);
	d3.select("#tSelect")
		.selectAll("option")
		.data(data)
		.enter().append("option")
		.attr("href", function(d) { return d.key; })
		.text(function(d) { 
			return d.value;
		});

}
/*
	Create a frequency box to show descending word frequencies
	Also appends the functionality to display surrounding word frequencies by clicking on a word
	transcript - the string transcript
	data - word frequencies given the transcript
*/
function appendFrequency(transcript, data) {
	var threshold = 3;
	var container = d3.select("#transcript");
	var sorted = sortByValue(data);

	sorted.forEach(d => {
		container.append("p")
		.text(d.key + " -> " + d.value)
		.on("click", function() {

			$('#word-clicked').text("Word Frequency Within " + threshold + " Spaces of: " + d.key);

			var surrounding = getSurroundingWords(transcript, d.key, 3); // TODO add dynamic threshold
			var sSorted = sortByValue(surrounding);

			var box = d3.select("#proximity");

			box.selectAll("p") // Remove all elements before appending new ones
			.remove();
				
			sSorted.forEach(f => { // Append new values
			box.append("p")
			.attr("class", "my-0")
			.text(f.key + " -> " + f.value);
			});

			
		});
	});
}

/*
	Takes an array of transcripts - removing all punctuation, stop words and null words - returns a single paragraph
*/
function scrubParagraphs(data) {
	// ouch
	var transcript = "";
	data.forEach(function(tsc) {
		tsc.forEach(function(d) {
			var formatted = d
			.replace(/[.]{3}/g, " ") // 3 dots usually indicate a space
			.replace(/[.?!]/ig, " ") // In case the space was forgotten
			//.replace(/[a-z][.?!][a-z]/ig, " ") // In case the space was forgotten
			.replace(/[ ]['][a-z]|['][" ][ ]/ig, " ") // remove quoted text
			.replace(/[/]/g, " ") // A slash usually indicates two words
			.replace(/[\u2026]/g, " ") // casually remove the triple ellipse unicode symbol smh
			.replace(/[.,"#!?$%\^&\*\[\];:{}=\-_~()“”\=\+]/g,'') // remove random formatting
			.replace(/[0-9][a-z]*/ig, ''); // remove all numbers

			transcript = transcript + formatted.toLowerCase() + " ";
		});
	});
	var spl = transcript.split(" ").filter(d => !stopWords.includes(d.trim())).filter(Boolean).join(" "); // Filter for non-null words and stopwords
	console.log(spl);
	return spl;
}

/*
	Return a dictionary of all word frequencies, given a string
*/
function getFrequencies(data) {
	var words = {};
	var spl = data.split(" ");

	for(var i=0;i<spl.length;i++) {
		var temp = spl[i].replace(/[" ]/g, '').toLowerCase().trim();
		if(!temp) continue;
		if(words[temp]) {
			words[temp] = words[temp] + 1;
		}
		else {
			words[temp] = 1;
		}

	}
	return words;
}
/*
	Takes an unordered dictionary, changes it to a d3.entries() array, sorts by(guaranteed numerical) value and returns it
*/
function sortByValue(datum) {

	var data = d3.entries(datum);
	var sorted = data.sort(function(f, s) { // Sort proximity words greatest to least
				return s.value - f.value;
	});
	return sorted;

}
/*
	Creates and returns a frequency dictionary of all words surrounding the one inputted, given:
	word - the word to build surroundings from
	threshold - how many words out to search
	transcript - a string to sort through
*/
function getSurroundingWords(transcript, word, threshold) {
	
	var data = transcript.split(" ");
	var index = -1;
	var words = "";
	//var frequencies = {};
	
	while((index = data.indexOf(word, index+1)) != -1) {
		var begin = index - threshold;
		var end = index + threshold + 1; // + 1 because the end will be exclusive
		if(begin < 0) {
			begin = 0;	
		} 
		if(end > (data.length - 1)) {
			end = data.length - 1;
		}

		words = words + data.slice(begin, index).join(" ") + " " + data.slice(index+1, end).join(" ") + " ";
	}
	
	return getFrequencies(words);

}
function getStats(datum) {
	var data = d3.entries(datum);

	var mean = d3.mean(data, d => d.value);
	var median = d3.median(data, d => d.value);
	var stdev = d3.deviation(data, d => d.value);
	var max = d3.max(data, d => d.value);
	var min = d3.min(data, d => d.value);

	console.log("stdev " + stdev);
	console.log("mean " + mean);
	console.log("median " + median);
	console.log("max " + max);
	console.log("min " + min);
	console.log("25th quantile " + d3.quantile(data, .25, d => d.value));
	console.log("50th quantile " + d3.quantile(data, .5, d => d.value));
	console.log("75th quantile " + d3.quantile(data, .75, d => d.value));
} 
function createGraph(datum) {

	var data = sortByValue(datum);

	var singleHeight = 8; // Approximate height of a single graph element

	var max = d3.max(data, d => d.value);

	//Create tooltip
	var tooltip = d3.select("#graph").append("div")
		.attr("style", "background-color: white;")
		.attr("class", "tooltip")
		.style("opacity", 0);


	// set the dimensions and margins of the graph
	var margin = {top: 40, right: 30, bottom: 40, left: 90},
    width = $("#graph").width() - margin.left - margin.right,
    height = (singleHeight * data.length) + margin.top + margin.bottom;

    var svg = d3.select("#graph")
    .append("svg")
    	.attr("width", width + margin.left + margin.right)
    	.attr("height", height)
    .append("g")
    	.attr("transform",
    		"translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleLinear()
	.domain([0, max])
	.range([0, width]);

	var y = d3.scaleBand()
	  .range([ 0, height ])
	  .domain(data.map(function(d) { return d.key; }))
	  .padding(.1);
	svg.append("g")
	  .call(d3.axisLeft(y))

	svg.append("g")
		.attr("transform", "translate(0,-5)")
		.call(d3.axisTop(x))
		.selectAll("text")
			.attr("transform", "translate(-10,0)")
			.style("text-anchor", "end");



	// Rectangles
	svg.selectAll("myRect")
	  .data(data)
	  .enter()
	  .append("rect")
	  .attr("x", 0 )
	  .attr("y", function(d) { return y(d.key); })
	  .attr("width", function(d) { return ((d.value * width) / max); })
	  .attr("height", y.bandwidth() )
	  .attr("fill", function(d) { return d.key.charCodeAt(0) % 2 ? "#64727b" : "#28363f" })
	  .on("mouseover", function(d) {
	  	tooltip.transition()
	  	.duration(200)
	  	.style("opacity", .9);
	  	tooltip.html("Word: " + d.key + "<br/>" + "Uses: " + d.value)
	  	.style("left", (d3.event.pageX) + "px")
	  	.style("top", (d3.event.pageY - 28) + "px");
	  }) 
	  .on("mouseout", function(d) {
	  	tooltip.transition()
	  	.duration(500)
	  	.style("opacity", 0);
	  });
}