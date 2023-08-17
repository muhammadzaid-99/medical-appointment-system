const mongoose = require('mongoose');
// const emailValidator = require('email-validator');
// const bcrypt = require('bcrypt');

// const db_link = "mongodb+srv://admin:zTws1bj4anDjLaLD@cluster0.gf30y5c.mongodb.net/hospital?retryWrites=true&w=majority"
const db_link = "mongodb://localhost:27017/url_shortener"
mongoose.connect(db_link) // promise so, then and catch are used
.then(function(db) {
    console.log("Database Connected Successfully!")
    // console.log(db)
})
.catch(function(err) {
    console.log(err)
});


const userSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        validate: function() {
            // return emailValidator.validate(this.email)
            return true
        } 
    },
    password:{
        type:String,
        required:true,
        minLength:8
    },
    confirmPassword:{
        type:String,
        required:true,
        minLength:8,
        validate: function(){
            return this.password == this.confirmPassword
        }
    }
})

// _______PRE AND POST HOOKS________________________
userSchema.pre('save', async function(){
    console.log("Before Saving in Database", this)
    this.confirmPassword = undefined;
    // because we do not need to save confirm password
    return; // do not encrypt

    let salt = await bcrypt.genSalt()
    this.password = await bcrypt.hash(this.password, salt)
})

userSchema.post('save', function(doc){
    console.log("After Saving in Database", doc)
})


const userModel = mongoose.model('userModel', userSchema)

module.exports = userModel