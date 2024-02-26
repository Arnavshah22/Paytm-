const express=require("express");
const router=express.Router();
const {authMiddleware} =require("../middleware");
const { Account } = require("../db");
const { default: mongoose } = require("mongoose");


router.get("/balance", authMiddleware,async (req,res)=>{
    const account=await Account.findOne({
        userId:req.userId
    })
    res.json({
        balance:account.balance
    })
});

router.post("/transfer",authMiddleware,async(req,res)=>{
    const session=await mongoose.startSession();
    session.startTransaction();

    const {amount,to}=req.body;

    //fetch the amount within transaction
    const account=await Account.findOne({userId:to}).session(session);

    if(!account || account.balance < amount){
        await session.abortTransaction();
        return res.status(400).json({
            mesage:"Insufficient Funds"
        })
    }
    const toAccount=await Account.findOne({userId:to}).session(session);
    if(!toAccount){
        await session.abortTransaction();
        return res.status(411).json({
            message:"Invalid account"
        })
    }
    //perform the transer transaction
    await Account.updateOne({userId:req.userId},{$inc:{balance:-amount}}).session(session);
    await Account.updateOne({userId:req.userId},{$inc :{balance:amount}}).session(session);

    await session.commitTransaction();
    res.json({
        message:"Transaction Successful"
    })


})
module.exports=router;