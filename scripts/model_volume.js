import {converter} from "culori";

const points = 1000000000

const toRgb = converter("rgb")

function jabColor(x,y,z) {return {mode:'jab', j:x, a:y, b:z}}
function cielabColor(x,y,z) {return {mode:'lab', l:x, a:y, b:z}}
function oklabColor(x,y,z) {return {mode:'oklab', l:x, a:y, b:z}}

const models = [
    {
        model: 'JzAzBz',
        color: jabColor,
        margins: [[0,0.222],[-0.109,0.129],[-0.185,0.134]]
    },
    {
        model: 'CIELAB',
        color: cielabColor,
        margins: [[0,100],[-125,125],[-125,125]]
    },
    {
        model: 'Oklab',
        color: oklabColor,
        margins: [[0,1],[-0.4,0.4],[-0.4,0.4]]
    }
]

models.forEach((model) => {

    var total = 0
    var valid = 0

    var mg = model.margins
    var step = Math.cbrt(Math.abs((mg[0][1]-mg[0][0])*(mg[1][1]-mg[1][0])*(mg[2][1]-mg[2][0]))/points)

    for (let x=mg[0][0];x<=mg[0][1];x+=step) {
        for (let y=mg[1][0];y<=mg[1][1];y+=step) {
            for (let z=mg[2][0];z<=mg[2][1];z+=step) {
                total++

                let color = model.color(x,y,z)

                let rgbColor = toRgb(color)

                if (rgbColor.r>0&&rgbColor.r<1&&rgbColor.g>0&&rgbColor.g<1&&rgbColor.b>0&&rgbColor.b<1) {
                    valid++
                }
            }
        } 
    }

    console.log(`${model.model}: ${Math.abs((mg[0][1]-mg[0][0])*(mg[1][1]-mg[1][0])*(mg[2][1]-mg[2][0]))*valid/total}`)
})