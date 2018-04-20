const fs = require('fs');
// There are a couple things to consider when parsing/manipulating large sets of data. There are myriad paths to the same end, although not all are optimal. I've included two files with two differing solutions for that reason. Although the approach below is perhaps more straightforward, it sacrifices much in terms of runtime complexity. The time complexity is at least O(n^2), given the numerous nested loops needed to parse and manipulate the files. The alternate file, slcsp.1.js, relies on a 'caching' methodology that practically eliminates any instances of quadratic runtime. The tradeoff is that space complexity increases due to the copying/creating of cache objects throughout the code. In essence, this represents part of the flexibility/beauty of Javascript, and of the process of programming in general: in discussing how to approach a problem, there are myriad options to consider, each with tradeoffs and unique advantages/disadvantages and opportunities for productive discussion.

//Pull the file in and read it using FS
const plansFile = fs.readFileSync('plans.csv', 'utf8')
const zipsFile = fs.readFileSync('zips.csv', 'utf8') //consistent quotes
const slcspFile = fs.readFileSync('slcsp.csv', 'utf8')

//Parse the csv to a JS array of objects after removing the first line that contains the headers. 
let fromCSVToJsArr = csv => {
  const result = [],
    rows = csv.split('\n'),
    rowHeads = rows[0].split(',');
  rows.shift()
  rows.forEach(line => {
    if (line) {
      let lineObj = {},
        lineInfo = line.split(',');
      lineInfo.map((info, i) => {
        lineObj[rowHeads[i]] = lineInfo[i]
      })
      result.push(lineObj)
    }
  })
  return result
}
//The opposite of the above function: take the inputted JS array and a filename and write a CSV file.
let fromJsArrToCSV = (jsArray, fileName) => {
  const lineHeaders = Object.keys(jsArray[0])
  let linesToMake = jsArray.map(row => {
    return lineHeaders.map(item => {
      return row[item]
    }).join(',')
  }).join('\n')
  linesToMake = lineHeaders.join(',') + '\n' + linesToMake

  fs.writeFileSync(fileName, linesToMake, 'utf8')
}
//Invoking the previously declared function to convert CSV Files to Javascript arrays.
const plansJSON = fromCSVToJsArr(plansFile),
  zipsJSON = fromCSVToJsArr(zipsFile),
  slcspJSON = fromCSVToJsArr(slcspFile);

//This is a helper function that removes duplicate rates from the array, so that if two silver plans have identical rates, they are not counted as the "second lowest" vs. the "lowest" price, and the next lowest price is used instead. 
let removeDuplicateRates = arr => {
  arr = arr.sort((a, b) => a - b)
  for (let i = arr.length - 2; i >= 0; i--) {
    if (arr[i] === arr[i + 1]) {
      arr.splice(i, 1)
    }
  }
  return arr
}
//This function derives the rate_area from the zip code of a given slcsp line. By matching the zip code to the slcsp entry, and filtering for multiple areas such that invalidate the zip, as specified in the instructions, we can then pass the returned object that contains the state and rate area through to a function that will parse the plans file for the silver plans that match the object's state and rate area. 
let deriveRateAreaFromZipcode = zip => {
  const item = zipsJSON.filter(zipItem => zip.zipcode === zipItem.zipcode)
  if (item.length < 1) return false
  else if (item.length === 1) return { state: item[0].state, rate_area: item[0].rate_area }
  else if (item.length > 1) {
    let { state, rate_area } = item[0]
    for (let i = 1; i < item.length; i++) {
      if (item[i].state !== state || item[i].rate_area !== rate_area) return false
    }
    return { state: item[0].state, rate_area: item[0].rate_area }
  }
}
//This function filters the plans file for silver plans in the state and rate area of the slcsp object passed in. It sorts the resultant array of items if they need to be, and invokes the helper function to remove duplicates. It then takes the second element and returns the rate if it is there, or false if it is not. 
let determineSLCSP = slcspObj => {
  let foundPlan = plansJSON.filter(plan => plan.state === slcspObj.state && plan.rate_area === slcspObj.rate_area && plan.metal_level === 'Silver').sort((a, b) => a.rate - b.rate)
  if (foundPlan.length) {
    removeDuplicateRates(foundPlan)
  }
  foundPlan = foundPlan.slice(1, 2)
  let foundRate = foundPlan.length ? foundPlan[0].rate : false
  return foundRate
}
//This function takes the slcsp file and runs it through the two functions above that parse and search the files. It then invokes the function that converts the result back to a CSV file. 
let solveSLCSP = file => {
  file.forEach(entry => {
    let foundRate = determineSLCSP(deriveRateAreaFromZipcode(entry))
    if (foundRate) entry.rate = foundRate
  })
  fromJsArrToCSV(file, 'slcsp.csv')
}
//Call the solving function
solveSLCSP(slcspJSON)

