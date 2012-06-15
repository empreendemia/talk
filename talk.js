/*----------------------------------------------------------------------------*/
/** Chat
*
* @ autor : Rafael Erthali
* @ since : 2012-04
*
* @ description : Servidor de chat
*/

var express = require('express');
var config = require('./config.js');
var model = require('./model.js');
var ejs = require('ejs')

var app = module.exports = express.createServer();

app.configure(function(){
    app.set('view engine', 'ejs');
    app.disable('view cache');
    app.set('view options', {layout : false});
});

app.get('/(load)?', function(request,response){
    response.header('Content-Type', 'text/javascript');
    response.render('chat.ejs', {baseUrl : 'http://' + config.baseUrl + ':' + config.port + '/'});
});

app.error(function(err){
    console.log(err);
});

var Conversant = model.Conversant;
Conversant.find(function(error,conversants){
    for(var conversant in conversants)
    {
        conversants[conversant].disconnect();
    }
});
/*----------------------------------------------------------------------------*/
/** connect
*
* @ autor : Rafael Erthal
* @ since : 2012-04
*
* @ description : Seta o status do usuario como conectado ou cadastra ele no banco e seta-o como conectado
*
* @ param userId : identificação do usuário que esta conectando ao chat
*/
 
app.get('/:userId/connect', function(request, response){
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Cache-Control', 'no-cache');
    var Conversant = model.Conversant;
    
    Conversant.find({user : request.params.userId}, function(error, conversants){
        if(error){
	    response.end('({"error" : "'+error+'"})');
	    return;
	}

        var conversant;
	if(conversants[0] === undefined)
            conversant = new Conversant({user : request.params.userId, company : request.query.companyId, label : request.query.label});
        else
            conversant = conversants[0];

        if(conversant.status === 'offline')
            conversant.connect();

	response.end('({"error" : ""})');

    });
});

/*----------------------------------------------------------------------------*/
/** open-chat
*
* @ autor : Rafael Erthal
* @ since : 2012-04
*
* @ description : Seta o status do usuario como conectado ou cadastra ele no banco e seta-o como conectado
*
* @ param userId : identificação do usuário que esta conectando ao chat
*/
 
app.get('/:userId/open-chat/:chatId', function(request, response){
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Cache-Control', 'no-cache');

    var Conversant = model.Conversant;
    
    Conversant.findOne({user : request.params.userId}, function(error, conversant){
        if(error){
	    response.end('({"error" : "'+error+'"})');
            return;
        }

        if(conversant === null) {
	    response.end('({"error" : "Usuário não encontrado"})');
	    return;
	}
        
        conversant.enableChat(request.params.chatId, function(error,from,to){
	    response.end('(' + JSON.stringify({error : error, from : from, to : to}) + ')');
	});
    });
});

/*----------------------------------------------------------------------------*/
/** close-chat
*
* @ autor : Rafael Erthal
* @ since : 2012-04
*
* @ description : Seta o status do usuario como conectado ou cadastra ele no banco e seta-o como conectado
*
* @ param userId : identificação do usuário que esta conectando ao chat
*/
 
app.get('/:userId/close-chat/:chatId', function(request, response){
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Cache-Control', 'no-cache');

    var Conversant = model.Conversant;
    
    Conversant.findOne({user : request.params.userId}, function(error, conversant){
        if(error){
	    response.end('({"error" : "'+error+'"})');
            return;
        }

        if(conversant === undefined) {
	    response.end('({"error" : "Usuário não encontrado"})');
	    return;
	}
        
        conversant.disableChat(request.params.chatId, function(error){
	    response.end('({"error" : "' + error + '"})');
	});   
    });
});

/*----------------------------------------------------------------------------*/
/** unread-messages
*
* @ autor : Rafael Erthal
* @ since : 2012-04
*
* @ description : pega todas as mensagens não lidas
*
* @ param userId : identificação do usuário que esta requisitando as mensagens
*/
 
app.get('/:userId/unread-messages/:chatId', function(request, response){
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Cache-Control', 'no-cache');

    var Conversant = model.Conversant;
    
    Conversant.findOne({user : request.params.userId}, function(error, conversant){
        if(error){
            response.end('({"error" : "'+error+'"})');
            return;
        }

        if(conversant === null)
	{
	    response.end('({"error" : "Usário não encontrado"})');
	    return;
	}

        if(conversant.status === 'offline'){
	    response.end('({"error" : "Usuário deslogado"})');
	    return;
	}

	conversant.unreadMessages(request.params.chatId, function(messages){
	    response.end('(' +JSON.stringify({error : "", messages : messages}) + ')');

            var length = messages.length; 
            for(var i = 0; i < length; i++)
                messages[i].read();
        });
    });
});

/*----------------------------------------------------------------------------*/
/** messages
*
* @ autor : Rafael Erthal
* @ since : 2012-04
*
* @ description : pega todas as mensagens
*
* @ param userId : identificação do usuário que esta requisitando as mensagens
*/
 
app.get('/:userId/messages/:chatId', function(request, response){
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Cache-Control', 'no-cache');

    var Conversant = model.Conversant;
    
    Conversant.findOne({user : request.params.userId}, function(error, conversant){
        if(error){
            response.end('({"error" : "'+error+'"})');
            return;
        }

        if(conversant === null)
	{
	    response.end('({"error" : "Usário não encontrado"})');
	    return;
	}
        
        if(conversant.status === 'offline'){
	    response.end('({"error" : "Usuário deslogado"})');
	    return;
	}
         
	conversant.messages(request.params.chatId, function(messages){ 
	    response.end('(' +JSON.stringify({error : "", messages : messages}) + ')');
	});
    });
});

/*----------------------------------------------------------------------------*/
/** send-message
*
* @ autor : Rafael Erthal
* @ since : 2012-04
*
* @ description : pega todas as conversas que estão ativas
*
* @ param userId : identificação do usuário que esta verificando as conversas
*/
 
app.get('/:userId/send-message/:to', function(request, response){
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Cache-Control', 'no-cache');

    var Conversant = model.Conversant;
    
    Conversant.findOne({user : request.params.userId}, function(error, conversant){
        if(error){
            response.end('({"error" : "'+error+'"})');
            return;
        }

        if(conversant === null){
	    response.end('({"error" : "Usuário não encontrado"})');
	    return;
	}

        if(conversant.status === 'offline'){
	    response.end('({"error" : "Usuário deslogado"})');
	    return;
	}

	conversant.sendMessage({message : request.query.message, to : request.params.to});

        response.end('({"error" : ""})');
    });
});

/*----------------------------------------------------------------------------*/
/** active-chats
*
* @ autor : Rafael Erthal
* @ since : 2012-04
*
* @ description : pega todas as conversas que estão ativas
*
* @ param userId : identificação do usuário que esta verificando as conversas
*/
 
app.get('/:userId/active-chats', function(request, response){
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Cache-Control', 'no-cache');

    var Conversant = model.Conversant;
    
    Conversant.findOne({user : request.params.userId}, function(error, conversant){
        if(error) response.end('({"error" : "'+error+'"})');
	
        if(conversant === null){
            response.end('({"error" : "Usuário não encontrado"})');
	    return;
        }

        if(conversant.status === 'offline'){
	    response.end('({"error" : "Usuário deslogado"})');
	    return;
	}

	console.log(conversant);

        conversant.refreshStatus();
        response.end("(" + JSON.stringify({error : "", activeChats : conversant.activeChats}) + ")");
    });
});

/*----------------------------------------------------------------------------*/
/** company-status
*
* @ autor : Rafael Erthal
* @ since : 2012-06
*
* @ description : retorna se a empresa esta online ou offline
*
* @ param userId : identificação do usuário que esta verificando as conversas
*/
 
app.get('/:companyId/company-status', function(request, response){
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Cache-Control', 'no-cache');

    var Conversant = model.Conversant;
    
    Conversant.findOne({company : request.params.companyId, status : 'online'}, function(error, conversant){
        if(error) response.end('({"error" : "'+error+'"})');
	
        if(conversant === null){
            response.end('({"error" : "", "status" : "offline"})');
        }
	else{
            response.end('({"error" : "", "status" : "online"})');
	}
    });
});

/*----------------------------------------------------------------------------*/
/** panel
*
* @ autor : Rafael Erthal
* @ since : 2012-06
*
* @ description : painel de controle do chat
*/
 
app.get('/panel', function(request, response){

    var Conversant = model.Conversant;
    
    Conversant.find({label : {$ne : 'Visitante'}},function(error, conversants){
        if(error) response.end('({"error" : "'+error+'"})');
	response.write("<table border CELLSPACING='2px'>");

	response.write(
	    "<tr>"+
	    "    <td>Usuario</td>"+
	    "    <td>Total de Conversas</td>"+
	    "    <td>Chat Started</td>"+
	    "    <td>Chat Started Reply</td>"+
	    "    <td>Chat Received</td>"+
	    "    <td>Chat Received Reply</td>"+
	    "</tr>"
	);

	for(var i = 0; i<conversants.length; i++)
	{
	    conversants[i].chats(function(conversant,chats){
	        response.write(
		    var chatStarted = 0,
		        chatStartedReply = 0;
			chatReceived = 0;
			chatReceivedReply = 0;

		    for(var i = 0; i < chats.length; i++)
		    {
		        var firstMessage = chats[i].messages[0];,
			    meSend = false;
			    otherSend = false;

			for(var j = 1; j < chats[i].messages.length; j++)
			{
			    if(chats[i].messages[j].date < firstMessage.date)
			    {
			        firstMessage = chats[i].messages[j];
			    }

			    if(chats[i].messages[j].from.toString === conversant._id.toString())
			    {
			        meSend = true;
			    }
			    else
			    {
			        otherSend = true;
			    }
			}

			if(firstMessage.from.toString() === conversant._id.toString())
			{
			    chatStarted++;
			    if(otherSend) chatStartedReply++;
			}
			else
			{
			    chatReceived++;
			    if(meSend) chatReceivedReply++;
			}
		    }

	            "<tr>" +
		    "    <td>" + conversant.label  + "</td>"+
		    "    <td>" + chats.length + "</td>"+
		    "    <td>" + chatStarted + "</td>"+
		    "    <td>" + chatStartedReply + "</td>"+
		    "    <td>" + chatReceived + "</td>"+
		    "    <td>" + chatReceivedReply + "</td>"+
	            "</tr>"
	        ); 
	    });
	}

	setTimeout(function(){response.end("</table>")}, 2000);
    });
});
/*----------------------------------------------------------------------------*/

app.listen(config.port);
