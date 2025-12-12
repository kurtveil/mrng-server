
// Mongoose Model 
const Project = require('../models/Project');
const Client = require('../models/Client');
const Product = require('../models/Product');
const User = require('../models/User');

const {
    GraphQLObjectType,
    GraphQLID,
    GraphQLString,
    GraphQLSchema,
    GraphQLList,
    GraphQLNonNull,
    GraphQLEnumType,
    GraphQLInt,
    GraphQLBoolean
} = require('graphql');

// ProjectType
const ProjectType = new GraphQLObjectType({
    name: 'Project',
    fields: () => ({
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        description: { type: GraphQLString },
        status: { type: GraphQLString },
        client: {
            type: ClientType,
            resolve(parent, args) {
                return Client.findById(parent.clientId);
            },
        },
    })
});

// ClientType
const ClientType = new GraphQLObjectType({
    name: 'Client',
    fields: () => ({
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        email: { type: GraphQLString },
        phone: { type: GraphQLString },
    })
});

// ProductType
const ProductType = new GraphQLObjectType({
    name: 'Product',
    fields: () => ({
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        description: { type: GraphQLString },
        price: { type: GraphQLInt },
        characteristics: { type: GraphQLString },
        amount: { type: GraphQLInt },
        image: { type: GraphQLString },
        code: { type: GraphQLString },
    })
});


const UserResponseType = new GraphQLObjectType({
    name: 'UserResponse',
    fields: () => ({
        success: { type: GraphQLNonNull(GraphQLBoolean) },
        user: { type: UserType },
        token: { type: GraphQLString }
    })
});


const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        password: { type: GraphQLString },
        username: { type: GraphQLString },
        email: { type: GraphQLString }
    })
});

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        projects: {
            type: new GraphQLList(ProjectType),
            resolve(parent, args) {
                return Project.find();
            }
        },
        project: {
            type: ProjectType,
            args: { id: { type: GraphQLID } },
            resolve(parent, args) {
                return Project.findById(args.id);
            }
        },
        clients: {
            type: new GraphQLList(ClientType),
            resolve(parent, args) {
                return Client.find();
            }
        },
        client: {
            type: ClientType,
            args: { id: { type: GraphQLID } },
            resolve(parent, args) {
                return Client.findById(args.id);
            }
        },
        user: {
            type: UserType,
            args: { id: { type: GraphQLID } },
            resolve(parent, args) {
                return User.findById(args.id);
            }
        },
        products: {
            type: new GraphQLList(ProductType),
            resolve(parent, args) {
                return Product.find();
            }
        },
        product: {
            type: new GraphQLList(ProductType),
            resolve(parent, args) {
                return Product.findById();
            }
        },
    }
});

//Mutations
const mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        // add a client
        addClient: {
            type: ClientType,
            args: {
                name: { type: GraphQLNonNull(GraphQLString) },
                email: { type: GraphQLNonNull(GraphQLString) },
                phone: { type: GraphQLNonNull(GraphQLString) },
            },
            resolve(parent, args) {
                const client = new Client({
                    name: args.name,
                    email: args.email,
                    phone: args.phone
                });
                return client.save();
            }
        },
        // Delete a client
        deleteClient: {
            type: ClientType,
            args: {
                id: { type: GraphQLNonNull(GraphQLID) },
            },
            async resolve(parent, args) {
                try {
                    const deletedClient = await Client.findByIdAndDelete(args.id);
                    if (!deletedClient) {
                        throw new Error(`No se encontró un cliente con el ID ${args.id}`);
                    }
                    return deletedClient;
                } catch (error) {
                    // Aquí puedes personalizar cómo manejar diferentes tipos de errores
                    console.error("Error al eliminar el cliente:", error.message);
                    throw new Error("No se pudo eliminar el cliente. Inténtalo de nuevo más tarde.");
                }
            },
        },
        //  User
        authUser: {// Authentication User
            type: UserResponseType,
            args: {
                email: { type: GraphQLNonNull(GraphQLString) },
                password: { type: GraphQLNonNull(GraphQLString) },
            },
            async resolve(_, args) {
                const user = await User.findOne({ email: args.email, password: args.password });
                if (user) {
                    return { success: true };
                } else {
                    throw new Error('User not found');
                }
            }
        },
        // Register User
        registerUser: {
            type: new GraphQLObjectType({
              name: 'RegisterResponse',
              fields: {
                success: { type: GraphQLNonNull(GraphQLBoolean) },
                message: { type: GraphQLString },
                user: { type: UserType },
              },
            }),
            args: {
              username: { type: GraphQLNonNull(GraphQLString) },
              email: { type: GraphQLNonNull(GraphQLString) },
              password: { type: GraphQLNonNull(GraphQLString) },
            },
            async resolve(_, args) {
              try {
                // Verificar si el correo electrónico ya existe
                const existingUser = await User.findOne({ email: args.email });
                if (existingUser) {
                  return {
                    success: false,
                    message: 'El correo electrónico ya está en uso.',
                    user: null,
                  };
                }
      
                // Crear y guardar el nuevo usuario
                const user = new User({
                  username: args.username,
                  email: args.email,
                  password: args.password,
                });
                const savedUser = await user.save();
      
                return {
                  success: true,
                  message: 'Usuario registrado con éxito.',
                  user: savedUser,
                };
              } catch (error) {
                console.error('Error al registrar usuario:', error);
                return {
                  success: false,
                  message: 'Error al registrar usuario.',
                  user: null,
                };
              }
            },
          },
        // projects
        // Add a project
        addProject: {
            type: ProjectType,
            args: {
                name: { type: GraphQLNonNull(GraphQLString) },
                description: { type: GraphQLNonNull(GraphQLString) },
                status: {
                    type: new GraphQLEnumType({
                        name: 'ProjectStatus',
                        values: {
                            'new': { value: 'Not Started' },
                            'progress': { value: 'In Progress' },
                            'completed': { value: 'Completed' },
                        }
                    }),
                    defaultValue: 'Not Started',
                },
                clientId: { type: GraphQLNonNull(GraphQLID) }
            },
            resolve(parent, args) {
                const project = new Project({
                    name: args.name,
                    description: args.description,
                    status: args.status,
                    clientId: args.clientId
                });
                return project.save();
            },
        },
        // delete a project
        deleteProject: {
            type: ProjectType,
            args: {
                id: { type: GraphQLNonNull(GraphQLID) }
            },
            resolve(parent, args) {
                return Project.findByIdAndDelete(args.id);
            }
        },
        //update a project
        updateProject: {
            type: ProjectType,
            args: {
                id: { type: GraphQLNonNull(GraphQLID) },
                name: { type: GraphQLString },
                description: { type: GraphQLString },
                status: {
                    type: new GraphQLEnumType({
                        name: 'ProjectStatusUpdate',
                        values: {
                            new: { value: 'Not Started' },
                            progress: { value: 'In Progress' },
                            completed: { value: 'Completed' }
                        }
                    })
                }
            },
            resolve(parent, args) {
                return Project.findByIdAndUpdate(
                    args.id,
                    {
                        $set: {
                            name: args.name,
                            description: args.description,
                            status: args.status
                        }
                    },
                    { new: true }
                );
            }
        },
        // Products
        // Add a product
        addProduct: {
            type: ProductType,
            args: {
                name: { type: GraphQLNonNull(GraphQLString) },
                description: { type: GraphQLNonNull(GraphQLString) },
                price: { type: GraphQLNonNull(GraphQLInt) },
                amount: { type: GraphQLNonNull(GraphQLInt) },
                characteristics: { type: GraphQLNonNull(GraphQLString) },
                code: { type: GraphQLNonNull(GraphQLString) }
            },
            resolve(parent, args) {
                const product = new Product({
                    name: args.name,
                    description: args.description,
                    price: args.price,
                    amount: args.amount,
                    characteristics: args.characteristics,
                    code: args.code
                });
                return product.save();
            },
        },
        // delete a product
        deleteProduct: {
            type: ProductType,
            args: {
                id: { type: GraphQLNonNull(GraphQLID) }
            },
            resolve(parent, args) {
                return Product.findByIdAndDelete(args.id);
            }
        },
        //update a product
        updateProduct: {
            type: ProductType,
            args: {
                id: { type: GraphQLNonNull(GraphQLID) },
                name: { type: GraphQLString },
                description: { type: GraphQLString },
                amount: { type: GraphQLNonNull(GraphQLInt) },
                price: { type: GraphQLNonNull(GraphQLInt) },
                characteristics: { type: GraphQLNonNull(GraphQLString) },

            },
            resolve(parent, args) {
                return Product.findByIdAndUpdate(
                    args.id,
                    {
                        $set: {
                            name: args.name,
                            description: args.description,
                            price: args.price,
                            amount: args.amount,
                            characteristics: args.characteristics
                        }
                    },
                    { new: true }
                );
            }
        },
    },
});

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation

});